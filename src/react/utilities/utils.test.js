import { getImagesByType, getImageProject, getImageRegistry, getImagesNamesSorted, getProjectImagesMap, getProjectNames, filterImagesByRegistry, getUniqueRegistries, getSessionIdleStatus } from './utils';
import { imageResponse } from './testData';

describe('Image List Processing Functions', () => {
    describe('getImagesByType', () => {
        const result = getImagesByType(imageResponse);

        test('excludes headless and desktop-app types', () => {
            expect(result.headless).toBeUndefined();
            expect(result['desktop-app']).toBeUndefined();
        });

        test('correctly groups notebook images by project', () => {
            expect(result.notebook.canucs).toBeDefined();
            expect(result.notebook.canucs.length).toBe(6);
            expect(result.notebook.canucs[0].id).toContain('canucs');
        });

        test('handles invalid input', () => {
            expect(getImagesByType(null)).toEqual({});
            expect(getImagesByType(undefined)).toEqual({});
            expect(getImagesByType([])).toEqual({});
            expect(getImagesByType([{}])).toEqual({});
        });
    });

    describe('getImageProject', () => {
        test('extracts project name from image id', () => {
            const image = {
                id: 'images.canfar.net/skaha/carta:4.0'
            };
            expect(getImageProject(image)).toBe('skaha');
        });

        test('handles various image id formats', () => {
            const testCases = [
                {id: 'images.canfar.net/project/name', expected: 'project'},
                {id: 'project/name', expected: 'name'},
                {id: 'single', expected: undefined},
                {id: '', expected: undefined}
            ];

            testCases.forEach(({id, expected}) => {
                expect(getImageProject({id})).toBe(expected);
            });
        });

        test('handles invalid inputs', () => {
            expect(getImageProject(null)).toBeUndefined();
            expect(getImageProject({})).toBeUndefined();
            expect(getImageProject({id: null})).toBeUndefined();
        });
    });

    describe('getImagesNamesSorted', () => {
        const testImages = [
            { id: 'images.canfar.net/project/astroflow-gpu-notebook:23.11' },
            { id: 'images.canfar.net/project/astroflow-gpu-notebook:latest' },
            { id: 'images.canfar.net/project/astroflow-gpu-notebook:24.02' },
            { id: 'images.canfar.net/project/beta-notebook:1.0.0' },
            { id: 'images.canfar.net/project/alpha-notebook:2.0.0' }
        ];

        test('sorts images alphabetically by name', () => {
            const sorted = getImagesNamesSorted(testImages);
            const imageNames = sorted.map(img => img.imageName);
            const sortedNames = [...imageNames].sort((a, b) =>
                a.localeCompare(b, undefined, { sensitivity: 'base' })
            );
            expect(imageNames).toEqual(sortedNames);
        });

        test('sorts versions in reverse order with latest first', () => {
            const sorted = getImagesNamesSorted(testImages);
            const gpuNotebookVersions = sorted
                .filter(img => img.imageName === 'astroflow-gpu-notebook')
                .map(img => img.version);

            expect(gpuNotebookVersions).toEqual(['latest', '24.02', '23.11']);
        });

        test('handles invalid input gracefully', () => {
            expect(getImagesNamesSorted(null)).toEqual([]);
            expect(getImagesNamesSorted(undefined)).toEqual([]);
            expect(getImagesNamesSorted([])).toEqual([]);
            expect(getImagesNamesSorted([null, undefined])).toEqual([]);
        });

        test('filters out images without valid id', () => {
            const mixedData = [
                { id: 'images.canfar.net/skaha/carta:4.0' },
                { id: '' },
                null,
                undefined,
                { notId: 'something' },
                { id: 'invalid/format' }
            ];
            const result = getImagesNamesSorted(mixedData);
            expect(result.length).toBe(1);
            expect(result[0].imageName).toBe('carta');
            expect(result[0].version).toBe('4.0');
        });

        test('preserves original image object properties', () => {
            const imageWithExtra = {
                id: 'images.canfar.net/skaha/carta:4.0',
                types: ['desktop-app'],
                digest: 'sha256:123'
            };
            const result = getImagesNamesSorted([imageWithExtra]);
            expect(result[0]).toMatchObject({
                ...imageWithExtra,
                imageName: 'carta',
                version: '4.0'
            });
        });

        test('correctly sorts complex version numbers', () => {
            const versionsTest = [
                { id: 'images.canfar.net/project/app:1.10.0' },
                { id: 'images.canfar.net/project/app:1.2.0' },
                { id: 'images.canfar.net/project/app:latest' },
                { id: 'images.canfar.net/project/app:1.1.0' }
            ];
            const sorted = getImagesNamesSorted(versionsTest);
            const versions = sorted.map(img => img.version);
            expect(versions).toEqual(['latest', '1.10.0', '1.2.0', '1.1.0']);
        });

        test('handles images with same name but different versions', () => {
            const sameNameImages = [
                { id: 'images.canfar.net/project/notebook:24.03' },
                { id: 'images.canfar.net/project/notebook:latest' },
                { id: 'images.canfar.net/project/notebook:23.11' },
                { id: 'images.canfar.net/project/notebook:24.02' }
            ];

            const result = getImagesNamesSorted(sameNameImages);
            const versions = result.map(img => img.version);
            expect(versions).toEqual(['latest', '24.03', '24.02', '23.11']);
        });

        test('processes semver-style versions correctly', () => {
            const semverImages = [
                { id: 'images.canfar.net/project/tool:2.1.0' },
                { id: 'images.canfar.net/project/tool:2.0.0' },
                { id: 'images.canfar.net/project/tool:2.1.1' },
                { id: 'images.canfar.net/project/tool:latest' }
            ];

            const result = getImagesNamesSorted(semverImages);
            const versions = result.map(img => img.version);
            expect(versions).toEqual(['latest', '2.1.1', '2.1.0', '2.0.0']);
        });

        test('handles malformed image IDs gracefully', () => {
            const malformedData = [
                { id: 'images.canfar.net/project/noversion' },
                { id: 'images.canfar.net/project/:1.0' },
                { id: 'images.canfar.net/project/' },
                { id: 'images.canfar.net///:' }
            ];

            const result = getImagesNamesSorted(malformedData);
            expect(result.every(item => item.name && item.version !== undefined)).toBe(true);
        });
    });
});

describe('getProjectImagesMap', () => {
    test('correctly groups and sorts images by project and version', () => {
        const images = [
            { id: 'images.canfar.net/skaha/jupyter:2.0' },
            { id: 'images.canfar.net/skaha/jupyter:latest' },
            { id: 'images.canfar.net/skaha/jupyter:1.0' },
            { id: 'images.canfar.net/skaha/notebook:2.0' },
            { id: 'images.canfar.net/canucs/analysis:1.0' }
        ];

        const result = getProjectImagesMap(images);

        // Check correct grouping by project
        expect(Object.keys(result).sort()).toEqual(['canucs', 'skaha']);
        expect(result.skaha).toHaveLength(4);
        expect(result.canucs).toHaveLength(1);

        // Check version sorting within same image name (latest first, then descending)
        const jupyterVersions = result.skaha
            .filter(img => img.imageName === 'jupyter')
            .map(img => img.version);
        expect(jupyterVersions).toEqual([
            'latest',
            '2.0',
            '1.0'
        ]);
    });

    test('sorts images alphabetically within projects', () => {
        const images = [
            { id: 'images.canfar.net/skaha/zebra:1.0' },
            { id: 'images.canfar.net/skaha/alpha:1.0' },
            { id: 'images.canfar.net/skaha/beta:latest' },
            { id: 'images.canfar.net/skaha/beta:2.0' }
        ];

        const result = getProjectImagesMap(images);

        const names = result.skaha.map(img => `${img.imageName}:${img.version}`);
        expect(names).toEqual([
            'alpha:1.0',
            'beta:latest',
            'beta:2.0',
            'zebra:1.0'
        ]);
    });

    test('preserves all original image properties', () => {
        const image = {
            id: 'images.canfar.net/skaha/test:1.0',
            types: ['notebook'],
            digest: 'sha256:123',
            customField: 'value'
        };

        const result = getProjectImagesMap([image]);
        expect(result.skaha[0]).toEqual(expect.objectContaining({
            ...image,
            imageName: 'test',
            version: '1.0'
        }));
    });

    test('handles invalid inputs and edge cases', () => {
        expect(getProjectImagesMap(null)).toEqual({});
        expect(getProjectImagesMap(undefined)).toEqual({});
        expect(getProjectImagesMap([])).toEqual({});
        expect(getProjectImagesMap([{ title: 'test' }])).toEqual({});
        expect(getProjectImagesMap([{ id: 'invalid' }])).toEqual({});

        const result = getProjectImagesMap([
            { id: 'images.canfar.net/skaha/test:1.0' },
            null,
            undefined,
            { id: '' },
            { id: 'invalid/format' },
            { id: 'registry/project/' },
            { id: 'registry//name:version' }
        ]);

        expect(result).toEqual({
            skaha: expect.any(Array)
        });

        // Verify the content of skaha array
        expect(result.skaha.length).toBe(1);
        expect(result.skaha[0]).toHaveProperty('imageName', 'test');
        expect(result.skaha[0]).toHaveProperty('version', '1.0');
    });

    test('filters out malformed image IDs', () => {
        const malformedData = [
            { id: 'images.canfar.net/project/noversion' },
            { id: 'images.canfar.net/project/:1.0' },
            { id: 'images.canfar.net/project/' },
            { id: 'images.canfar.net///:' },
            { id: 'images.canfar.net/valid/image:1.0' }
        ];

        const result = getProjectImagesMap(malformedData);
        expect(Object.keys(result)).toEqual(['valid']);
        expect(result.valid.length).toBe(1);
        expect(result.valid[0]).toHaveProperty('imageName', 'image');
        expect(result.valid[0]).toHaveProperty('version', '1.0');
    });

    test('correctly handles multiple versions of same image in project', () => {
        const images = [
            { id: 'images.canfar.net/project/app:1.0.0' },
            { id: 'images.canfar.net/project/app:2.0.0' },
            { id: 'images.canfar.net/project/app:latest' },
            { id: 'images.canfar.net/project/app:1.5.0' }
        ];

        const result = getProjectImagesMap(images);
        const versions = result.project.map(img => img.version);
        expect(versions).toEqual(['latest', '2.0.0', '1.5.0', '1.0.0']);
    });

    test('maintains distinct projects with same image names', () => {
        const images = [
            { id: 'images.canfar.net/project1/app:1.0' },
            { id: 'images.canfar.net/project2/app:1.0' }
        ];

        const result = getProjectImagesMap(images);
        expect(Object.keys(result).sort()).toEqual(['project1', 'project2']);
        expect(result.project1).toHaveLength(1);
        expect(result.project2).toHaveLength(1);

        // Verify both projects have the correct name/version structure
        expect(result.project1[0]).toHaveProperty('imageName', 'app');
        expect(result.project1[0]).toHaveProperty('version', '1.0');
        expect(result.project2[0]).toHaveProperty('imageName', 'app');
        expect(result.project2[0]).toHaveProperty('version', '1.0');
    });

    test('handles complex project structures', () => {
        const images = [
            { id: 'images.canfar.net/project/app-v1:latest' },
            { id: 'images.canfar.net/project/app-v1:2.0.0' },
            { id: 'images.canfar.net/other/app-v1:1.0.0' },
            { id: 'images.canfar.net/project/app-v2:latest' }
        ];

        const result = getProjectImagesMap(images);

        expect(Object.keys(result).sort()).toEqual(['other', 'project']);
        expect(result.project).toHaveLength(3);

        // Check sorting within project
        const projectNames = result.project.map(img => `${img.imageName}:${img.version}`);
        expect(projectNames).toEqual([
            'app-v1:latest',
            'app-v1:2.0.0',
            'app-v2:latest'
        ]);
    });
});

describe('getProjectNames', () => {
    test('returns sorted project names from project map', () => {
        const projectMap = {
            'skaha': [{ name: 'test1' }],
            'canucs': [{ name: 'test2' }],
            'lsst': [{ name: 'test3' }]
        };

        expect(getProjectNames(projectMap)).toEqual(['canucs', 'lsst', 'skaha']);
    });

    test('handles empty project map', () => {
        expect(getProjectNames({})).toEqual([]);
    });

    test('handles invalid inputs', () => {
        expect(getProjectNames(null)).toEqual([]);
        expect(getProjectNames(undefined)).toEqual([]);
    });
});

describe('Registry Utility Functions', () => {
    describe('getImageRegistry', () => {
        test('extracts registry from valid image id', () => {
            expect(getImageRegistry({id: 'images.canfar.net/skaha/carta:4.0'}))
                .toBe('images.canfar.net');
        });

        test('handles various image id formats', () => {
            const testCases = [
                {id: 'images.canfar.net/project/name:1.0', expected: 'images.canfar.net'},
                {id: 'images.opencadc.org/project/name:1.0', expected: 'images.opencadc.org'},
                {id: 'project/name', expected: 'project'},
                {id: 'single', expected: 'single'},
                {id: '', expected: undefined}
            ];

            testCases.forEach(({id, expected}) => {
                expect(getImageRegistry({id})).toBe(expected);
            });
        });

        test('handles invalid inputs', () => {
            expect(getImageRegistry(null)).toBeUndefined();
            expect(getImageRegistry({})).toBeUndefined();
            expect(getImageRegistry({id: null})).toBeUndefined();
        });
    });

    describe('filterImagesByRegistry', () => {
        const mixedImages = [
            {id: 'images.canfar.net/skaha/notebook:1.0'},
            {id: 'images.opencadc.org/project/tool:1.0'},
            {id: 'images.canfar.net/canucs/analysis:2.0'}
        ];

        test('filters images by registry correctly', () => {
            const result = filterImagesByRegistry(mixedImages, 'images.canfar.net');
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('images.canfar.net/skaha/notebook:1.0');
            expect(result[1].id).toBe('images.canfar.net/canucs/analysis:2.0');
        });

        test('filters for different registry', () => {
            const result = filterImagesByRegistry(mixedImages, 'images.opencadc.org');
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('images.opencadc.org/project/tool:1.0');
        });

        test('returns empty array for non-matching registry', () => {
            const result = filterImagesByRegistry(mixedImages, 'nonexistent.registry.com');
            expect(result).toEqual([]);
        });

        test('returns empty array for invalid inputs', () => {
            expect(filterImagesByRegistry(null, 'images.canfar.net')).toEqual([]);
            expect(filterImagesByRegistry(undefined, 'images.canfar.net')).toEqual([]);
            expect(filterImagesByRegistry(mixedImages, null)).toEqual([]);
            expect(filterImagesByRegistry(mixedImages, undefined)).toEqual([]);
            expect(filterImagesByRegistry(mixedImages, '')).toEqual([]);
        });
    });

    describe('getUniqueRegistries', () => {
        test('returns sorted unique registries', () => {
            const images = [
                {id: 'images.canfar.net/skaha/notebook:1.0'},
                {id: 'images.opencadc.org/project/tool:1.0'},
                {id: 'images.canfar.net/canucs/analysis:2.0'}
            ];
            expect(getUniqueRegistries(images)).toEqual([
                'images.canfar.net',
                'images.opencadc.org'
            ]);
        });

        test('handles single registry', () => {
            const images = [
                {id: 'images.canfar.net/skaha/notebook:1.0'},
                {id: 'images.canfar.net/canucs/analysis:2.0'}
            ];
            expect(getUniqueRegistries(images)).toEqual(['images.canfar.net']);
        });

        test('handles empty inputs', () => {
            expect(getUniqueRegistries(null)).toEqual([]);
            expect(getUniqueRegistries(undefined)).toEqual([]);
            expect(getUniqueRegistries([])).toEqual([]);
        });

        test('handles images without valid ids', () => {
            const images = [
                {id: 'images.canfar.net/skaha/notebook:1.0'},
                {notId: 'something'},
                null,
                undefined,
                {}
            ];
            expect(getUniqueRegistries(images)).toEqual(['images.canfar.net']);
        });
    });
});

describe('getSessionIdleStatus', () => {
    const HOURS_THRESHOLD = 48;
    const CPU_THRESHOLD = 0.5;
    const OVER_THRESHOLD_HOURS = 72;
    const UNDER_THRESHOLD_HOURS = 24;

    // Helper to create a startTime N hours ago
    const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

    test('returns true for running session older than threshold with low CPU', () => {
        const session = { status: "Running", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: "0.1" };
        expect(getSessionIdleStatus(session, HOURS_THRESHOLD, CPU_THRESHOLD)).toBe(true);
    });

    test('returns false for running session younger than threshold', () => {
        const session = { status: "Running", startTime: hoursAgo(UNDER_THRESHOLD_HOURS), cpuCoresInUse: "0.1" };
        expect(getSessionIdleStatus(session, HOURS_THRESHOLD, CPU_THRESHOLD)).toBe(false);
    });

    test('returns false for running session with high CPU usage', () => {
        const session = { status: "Running", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: "2.5" };
        expect(getSessionIdleStatus(session, HOURS_THRESHOLD, CPU_THRESHOLD)).toBe(false);
    });

    test('returns false for non-Running sessions', () => {
        expect(getSessionIdleStatus(
            { status: "Pending", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: "0" },
            HOURS_THRESHOLD, CPU_THRESHOLD
        )).toBe(false);

        expect(getSessionIdleStatus(
            { status: "Terminating", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: "0" },
            HOURS_THRESHOLD, CPU_THRESHOLD
        )).toBe(false);
    });

    test('treats null/undefined cpuCoresInUse as 0 (idle)', () => {
        expect(getSessionIdleStatus(
            { status: "Running", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: null },
            HOURS_THRESHOLD, CPU_THRESHOLD
        )).toBe(true);

        expect(getSessionIdleStatus(
            { status: "Running", startTime: hoursAgo(OVER_THRESHOLD_HOURS) },
            HOURS_THRESHOLD, CPU_THRESHOLD
        )).toBe(true);
    });

    test('handles cpuCoresInUse as number', () => {
        expect(getSessionIdleStatus(
            { status: "Running", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: 0.3 },
            HOURS_THRESHOLD, CPU_THRESHOLD
        )).toBe(true);

        expect(getSessionIdleStatus(
            { status: "Running", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: 1.0 },
            HOURS_THRESHOLD, CPU_THRESHOLD
        )).toBe(false);
    });

    test('returns false for CPU exactly at threshold', () => {
        const session = { status: "Running", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: "0.5" };
        expect(getSessionIdleStatus(session, HOURS_THRESHOLD, CPU_THRESHOLD)).toBe(false);
    });

    test('returns false for null/undefined session', () => {
        expect(getSessionIdleStatus(null, HOURS_THRESHOLD, CPU_THRESHOLD)).toBe(false);
        expect(getSessionIdleStatus(undefined, HOURS_THRESHOLD, CPU_THRESHOLD)).toBe(false);
    });

    test('returns false when startTime is missing', () => {
        const session = { status: "Running", cpuCoresInUse: "0.1" };
        expect(getSessionIdleStatus(session, HOURS_THRESHOLD, CPU_THRESHOLD)).toBe(false);
    });

    test('respects different threshold values', () => {
        const session = { status: "Running", startTime: hoursAgo(OVER_THRESHOLD_HOURS), cpuCoresInUse: "0.3" };
        expect(getSessionIdleStatus(session, HOURS_THRESHOLD, CPU_THRESHOLD)).toBe(true);
        expect(getSessionIdleStatus(session, OVER_THRESHOLD_HOURS + 1, CPU_THRESHOLD)).toBe(false);
        expect(getSessionIdleStatus(session, HOURS_THRESHOLD, 0.1)).toBe(false);
    });
});