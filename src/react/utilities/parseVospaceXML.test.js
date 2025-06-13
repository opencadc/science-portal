import { parseVospaceXML } from "./parseVospaceXML";
import fs from "fs";
import path from "path";
import { DOMParser } from "xmldom";

test('parseVospaceXML parses storage XML correctly', () => {
    const xmlString = fs.readFileSync(path.join(__dirname, "mockFile.xml"), "utf8");
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, "text/xml");
    const result = parseVospaceXML(xml);

    expect(result.size).toBe(11281599102);
    expect(result.quota).toBe(200000000000);
    expect(typeof result.date).toBe('string');
    expect(result.date).toMatch(/2025/);
    expect(result.usage).toBeCloseTo(5.640799, 5); // (size/quota)*100
});
