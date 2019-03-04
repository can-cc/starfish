jest.mock('../modules/render/render-themer');
jest.mock('../modules/render/render-plugin');
jest.mock('./Category');

import { Blog } from "./Blog";
import { RenderController } from "../modules/render/render-controller";
import { FSBlogReader } from "../modules/reader/FSBlogReader";
import { Category } from "./Category";


test('Blog load func', () => {
    const blogInputPath = '';
    const blogOutputPath = '';
    const blogConfigure = {} as BlogConfigure;

    const reader = new FSBlogReader();

    jest.spyOn(reader, 'readCategoryPaths').mockImplementation(() => {
        return ['/d/1', '/d/2'];
    });
    
    const renderController = new RenderController('', '', {
    } as BlogConfigure, reader);
    const blog = new Blog({blogInputPath, blogOutputPath, blogConfigure}, renderController);
    
    blog.load();

    expect((<any>blog).categoryList).toBeDefined();
    expect((<any>blog).blogHome).toBeDefined();
    expect((<any>blog).categorys).toBeDefined();
    (<any>blog).categorys.forEach((c: Category) => {
        expect(c.load).toBeCalled();
    }); 
});


