import * as http from "http";
import * as Koa from 'koa';
import {AsyncUnloaderContainerModule} from './async-unloader-container.module';
import {UnloaderContainer} from './unloader.container';

const httpServer = new AsyncUnloaderContainerModule(async bind => {
    bind<http.Server>('cool').toDynamicValue(() => {
    const koa = new Koa();
    return koa.listen(3000);
    }).inSingletonScope();
}, unload => {
    unload<http.Server>('cool').fromInjectedValue((server) => server.close());
});

const container = new UnloaderContainer();

async function main() {
    await container.loadAsync(httpServer);
    const server = container.get('cool');
}

main().catch(console.error);

setTimeout(() => {
    container.unbindAll();
}, 2000);
