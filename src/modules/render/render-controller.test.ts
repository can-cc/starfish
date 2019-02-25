const blogLoadSpy = jest.fn(() => {});
const blogRenderSpy = jest.fn(() => {});
const pluginRunPluinAfterRenderSpy = jest.fn(() => {});
const themerCopyThemeAssetSpy = jest.fn(() => {});

jest.mock('./render-themer', () => ({
    RenderThemer: class MockRenderThemer {
        copyThemeAsset = themerCopyThemeAssetSpy; 
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
import { FSBlogReader } from "../reader/FSBlogReader";

test('render-controller initial', () => {
    const reader = new FSBlogReader();
    const renderController = new RenderController('', '', {
    } as BlogConfigure, reader);
    expect(renderController.renderThemer).toBeDefined();
    expect(renderController.renderPluginManager).toBeDefined();
});


test('render-controller render', () => {
    const reader = new FSBlogReader();
    

    const renderController = new RenderController('', '', {
        AUTHOR: {
            NAME: 'Obama'
        },
    } as BlogConfigure, reader);
    jest.spyOn<any, 'insureOutputExist'>(renderController, 'insureOutputExist').mockImplementation(() => {});
    renderController.render();
    
});