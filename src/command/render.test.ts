const renderSpy = jest.fn(() => {});

jest.mock('../modules/render/render-controller', () => {
  return {
    RenderController: class MockRenderController {
      render = renderSpy;
    }
  };
});
jest.mock('../lib/util', () => {
  return {
    isDir: () => true
  };
});

import RenderCommand from './render';

const tick = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 1);
  });
};

test('render command', async () => {
  const renderCommand = new RenderCommand();
  jest
    .spyOn<any, 'cleanOutPutAssets'>(renderCommand, 'cleanOutPutAssets')
    .mockImplementation(() => {
      return Promise.resolve();
    });
  jest.spyOn<any, 'startSpin'>(renderCommand, 'startSpin').mockImplementation(() => {});
  jest.spyOn<any, 'stopSpinSuccess'>(renderCommand, 'stopSpinSuccess').mockImplementation(() => {});
  jest.spyOn<any, 'stopSpinFail'>(renderCommand, 'stopSpinFail').mockImplementation(() => {});
  renderCommand.run(['/d/'], [], {} as BlogConfigure);
  await tick();
  expect(renderSpy.mock.calls.length).toBe(1);
});
