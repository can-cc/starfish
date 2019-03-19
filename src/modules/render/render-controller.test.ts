const blogLoadSpy = jest.fn(() => {});
const blogRenderSpy = jest.fn(() => {});
const pluginRunPluinAfterRenderSpy = jest.fn(() => {});
const themerCopyThemeAssetSpy = jest.fn(() => {});

jest.mock('./render-themer', () => ({
    RenderThemer: class MockRenderThemer {
        copyThemeAsset = themerCopyThemeAssetSpy;
        load = () => {};
    }
}));
jest.mock('./render-plugin', () => ({
    RenderPluginManager: class MockRenderPluginManager {
        runPluinAfterRender = pluginRunPluinAfterRenderSpy;
    }
}));
jest.mock('../../model/Blog', () => {
    return {
        Blog: class MockBlog {
            load = blogLoadSpy;
            render = blogRenderSpy;
        }
    }
});

import { RenderController } from "./render-controller";
import { FSReader } from "../reader/FSReader";
import { FSWriter } from "../writer/FSWriter";

test('render-controller initial', () => {
    const reader = new FSReader();
    const writer = new FSWriter();
    const renderController = new RenderController('', '', {
    } as BlogConfigure, reader, writer);
    expect(renderController.renderThemer).toBeDefined();
    expect(renderController.renderPluginManager).toBeDefined();
});


test('render-controller render', () => {
    const reader = new FSReader();
    const writer = new FSWriter();

    const renderController = new RenderController('', '', {
        AUTHOR: {
            NAME: 'Obama'
        },
    } as BlogConfigure, reader, writer);
    jest.spyOn<any, 'insureOutputExist'>(renderController, 'insureOutputExist').mockImplementation(() => {});
    renderController.render();
    
});