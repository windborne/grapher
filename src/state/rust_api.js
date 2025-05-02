let rustApiModule;
export const RustAPIPromise = import('../rust/pkg/index.js').then((module) => {
    return module.default().then(() => {
        rustApiModule = module;
    });
});

export default function RustAPI() {
    return rustApiModule;
}
