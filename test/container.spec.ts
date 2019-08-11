import {expect} from 'chai';
import {UnloaderContainer, UnloaderContainerModule} from '../src';

describe('the container', () => {

    it('should bind an unloader module in the container', async () => {
        const container = new UnloaderContainer();
        const module = new UnloaderContainerModule((bind) => {
            bind<string>('hello').toConstantValue('world');
        }, (unload => {
            unload<string>('hello').fromInjectedValue((str) => {
                expect(str).to.be.equals('world');
            });
        }));
        container.load(module);
        container.unbindAll();
    });

    it('should bind multiple values to an unloader module in the container', async () => {
        const container = new UnloaderContainer();
        const module = new UnloaderContainerModule((bind) => {
            bind<string>('hello').toConstantValue('everyone');
            bind<string>('hello').toConstantValue('world');
        }, (unload => {
            unload<string>('hello').fromAllInjected((elements) => {
                expect(elements).to.be.an('array');
                expect(elements.length).to.be.equals(2);
            });
        }));
        container.load(module);
        container.unbindAll();
    });
});
