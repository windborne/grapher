export default async function pyodideReady() {
    if (window.pyodide) {
        return window.pyodide;
    }

    while (!window.languagePluginLoader) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    await window.languagePluginLoader;

    return window.pyodide;
}
