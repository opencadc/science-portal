export function parseVospaceXML(xml) {
    const getProp = (name) => {
        // Use getElementsByTagName instead of querySelector for better browser compatibility
        const properties = xml.getElementsByTagName("vos:property");

        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            const uri = prop.getAttribute("uri");
            if (uri && uri.includes(name)) {
                return prop.textContent || prop.innerText || "";
            }
        }
        return null;
    };

    const size = Number(getProp("length")) || 0;
    const quota = Number(getProp("quota")) || 0;
    const dateRaw = getProp("date");

    const date = dateRaw
        ? new Date(dateRaw).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
        })
        : "";

    return {
        size,
        quota,
        date,
        usage: quota ? (size / quota) * 100 : 0,
    };
}