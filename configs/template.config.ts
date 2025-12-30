import handlebars from 'handlebars';
import path from 'path';
import configs from './config';
import storageHelper from '../utils/helpers/storage.helper';
import hbsHelpers from '../utils/helpers/handlebars.helper';

/**
 * Template rendering service using Handlebars
 * Singleton pattern for template engine configuration
 */
class Template {
  private static instance: Template;
  private storage: typeof storageHelper;
  private templatePath: string;

  private constructor(storage: typeof storageHelper) {
    if (Template.instance) {
      return Template.instance;
    }

    this.storage = storage;
    this.templatePath = configs.getValue('TEMPLATE_PATH');
    Template.instance = this;

    // Register all Handlebars helpers
    for (const helperName in hbsHelpers) {
      if (Object.hasOwnProperty.call(hbsHelpers, helperName)) {
        handlebars.registerHelper(helperName, (hbsHelpers as any)[helperName]);
      }
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(storage: typeof storageHelper = storageHelper): Template {
    if (!Template.instance) {
      Template.instance = new Template(storage);
    }
    return Template.instance;
  }

  /**
   * Get full path to template file
   */
  getPath(file: string, extension: string): string {
    return path.join(__dirname, '../' + this.templatePath + '/' + file + extension);
  }

  /**
   * Render template with layout
   * @param template - Template file name
   * @param options - Template data
   * @param layout - Layout file path
   * @param extension - File extension
   * @returns Rendered HTML string
   */
  async render(
    template: string,
    options: Record<string, any>,
    layout: string = 'layouts/default',
    extension: string = '.hbs'
  ): Promise<string> {
    const layoutPath = this.getPath(layout, extension);
    const layoutSource = await this.storage.getFile(layoutPath);
    const layoutTemplate = handlebars.compile(layoutSource as string);

    const contentPath = this.getPath(template, extension);
    const contentSource = await this.storage.getFile(contentPath);
    handlebars.registerPartial('body', contentSource as string);

    const result = layoutTemplate({
      body: handlebars.compile('{{> body }}')({
        app_settings: configs.getAppInfo(),
        app_name: configs.getName(),
        ...options,
      }),
    });

    return result;
  }
}

export default Template.getInstance(storageHelper);
