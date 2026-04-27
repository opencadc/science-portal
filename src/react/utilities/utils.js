const DESKTOP_APP = 'desktop-app';
const HEADLESS = 'headless';

const getImagesByType = (images) => {
    if (!Array.isArray(images)) return {};

    return images.reduce((acc, img) => {
        if (!img?.types) return acc;

        img.types.forEach((bType) => {
            let type = bType;
            if (type === HEADLESS || type === DESKTOP_APP) {
                return acc;
            }

            const imageProject = getImageProject(img);
            if (!imageProject) return acc;

            if (!acc[type]) {
                acc[type] = {};
            }
            if (!acc[type][imageProject]) {
                acc[type][imageProject] = [];
            }

            acc[type][imageProject].push(img);
        });
        return acc;
    }, {});
};

const getImageProject = (image) => {
    if (!image?.id) return undefined;
    const parts = image.id.split('/');
    return parts?.[1];
};

const getImageRegistry = (image) => {
    if (!image?.id) return undefined;
    const parts = image.id.split('/');
    return parts?.[0];
};

const filterImagesByRegistry = (images, registry) => {
    if (!Array.isArray(images) || !registry) return [];
    return images.filter(image => getImageRegistry(image) === registry);
};

const getUniqueRegistries = (images) => {
    if (!Array.isArray(images)) return [];
    const registries = new Set();
    images.forEach(image => {
        const registry = getImageRegistry(image);
        if (registry) registries.add(registry);
    });
    return Array.from(registries).sort();
};

const getImageName = (image) => {
    if (!image?.id) return undefined;
    const parts = image.id.split('/');
    return parts?.[2];
};

const isValidImageId = (id) => {
    if (!id || typeof id !== 'string') return false;
    const parts = id.split('/');
    if (parts.length !== 3) return false;
    const [registry, project, imageWithVersion] = parts;
    if (!registry || !project || !imageWithVersion) return false;
    const [imageName, version] = imageWithVersion.split(':');
    return Boolean(imageName && version);
};

const getImagesNamesSorted = (images) => {
    if (!Array.isArray(images)) return [];

    return images
        .filter(image => image?.id)
        .map(image => {
            const parts = image.id.split('/');
            const imageWithVersion = parts[2] || '';
            const [imageName, version] = imageWithVersion.split(':');

            return {
                ...image,
                name: imageWithVersion,
                imageName,
                version: version || ''
            };
        })
        .filter(image => image.imageName)
        .sort((a, b) => {
            if (a.imageName === b.imageName) {
                // Handle version comparison for same image names
                if (a.version === 'latest') return -1;
                if (b.version === 'latest') return 1;
                return b.version.localeCompare(a.version, undefined, {
                    numeric: true,
                    sensitivity: 'base'
                });
            }
            // Sort image names alphabetically
            return a.imageName.localeCompare(b.imageName, undefined, {
                sensitivity: 'base',
            });
        });
};

const getProjectImagesMap = (images) => {
    if (!Array.isArray(images)) return {};

    // First group images by project
    const projectGroups = images.reduce((acc, image) => {
        if (!image?.id) return acc;

        const projectName = getImageProject(image);
        // Skip invalid project names or malformed IDs
        if (!projectName || !isValidImageId(image.id)) return acc;

        if (!acc[projectName]) {
            acc[projectName] = [];
        }

        acc[projectName].push(image);
        return acc;
    }, {});

    // Then sort images within each project
    Object.keys(projectGroups).forEach(projectName => {
        projectGroups[projectName] = getImagesNamesSorted(projectGroups[projectName]);
    });

    return projectGroups;
};

const getProjectNames = (keyedProjects) => {
    if (!keyedProjects) return []
    return Object.keys(keyedProjects).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
};

module.exports = {
    getImagesByType,
    getImageProject,
    getImageRegistry,
    getImagesNamesSorted,
    getProjectImagesMap,
    getProjectNames,
    filterImagesByRegistry,
    getUniqueRegistries
};