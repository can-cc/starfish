jest.mock('./render-themer');
jest.mock('./render-plugin');

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
    expect(renderController.renderThemer).toBeDefined();
    expect(renderController.renderPluginManager).toBeDefined();
});