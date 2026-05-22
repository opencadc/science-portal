/**
 * Parse a VOSpace `GET /nodes/<path>` XML response into the storage shape
 * the UI consumes (used / quota / mtime / usage %).
 *
 * Only the *root* node's properties are read. VOSpace responses may include
 * children under `<vos:nodes>` and each child has its own
 * `<vos:property uri=".../core#length">`; iterating across the whole XML
 * would let a leaf's size overwrite the home-directory aggregate, which is
 * exactly the bug seen on staging-src (root-aggregate 18.8 MB → last-child
 * 9.27 KB).
 */

export interface StorageData {
  size: number;
  quota: number;
  date: string;
  usage: number;
}

export function parseVOSpaceXML(xmlText: string): StorageData {
  let size = 0;
  let quota = 0;
  let date = new Date().toISOString();

  // Root properties always precede the children block per the VOSpace XML
  // schema. Slice off everything from the first `<vos:nodes>` onward so the
  // regex can only see the root's <vos:properties>.
  const childrenStart = xmlText.indexOf('<vos:nodes');
  const rootScope = childrenStart >= 0 ? xmlText.slice(0, childrenStart) : xmlText;

  const propertyRegex = /<vos:property[^>]*uri="([^"]*)"[^>]*>([\s\S]*?)<\/vos:property>/g;
  let match;
  while ((match = propertyRegex.exec(rootScope)) !== null) {
    const uri = match[1];
    const value = match[2].trim();

    if (uri.includes('vospace/core#length')) {
      size = parseInt(value, 10) || 0;
    } else if (uri.includes('vospace/core#quota')) {
      quota = parseInt(value, 10) || 0;
    } else if (uri.includes('vospace/core#date')) {
      date = value;
    }
  }

  const usage = quota > 0 ? (size / quota) * 100 : 0;
  return { size, quota, date, usage };
}
