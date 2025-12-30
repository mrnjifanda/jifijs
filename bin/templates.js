#!/usr/bin/env node

const templates = {
  /**
   * Type template
   */
  type: (ClassName, fileName) => `import { BaseDocument } from './service.types';

/**
 * ${ClassName} document interface
 */
export interface I${ClassName} extends BaseDocument {
  name: string;
  description?: string;
  status: '${fileName.toLowerCase()}_status_active' | '${fileName.toLowerCase()}_status_inactive';
  // Add more fields as needed
}

/**
 * ${ClassName} status enum
 */
export enum ${ClassName}Status {
  ACTIVE = '${fileName.toLowerCase()}_status_active',
  INACTIVE = '${fileName.toLowerCase()}_status_inactive',
}

/**
 * ${ClassName} creation payload
 */
export interface I${ClassName}CreatePayload {
  name: string;
  description?: string;
  status?: ${ClassName}Status;
}

/**
 * ${ClassName} update payload
 */
export interface I${ClassName}UpdatePayload {
  name?: string;
  description?: string;
  status?: ${ClassName}Status;
}
`,

  /**
   * Controller template
   */
  controller: (ClassName, fileName, folder) => `import { Request, Response, NextFunction } from 'express';
import BaseController from '../../../utils/bases/base.controller';
import ${fileName}Service from '../../services/${folder}/${fileName}.service';

/**
 * ${ClassName} Controller
 * Handles ${fileName} operations
 */
class ${ClassName}Controller extends BaseController {
  private static instance: ${ClassName}Controller;

  private constructor() {
    if (${ClassName}Controller.instance) {
      return ${ClassName}Controller.instance;
    }
    super();
    ${ClassName}Controller.instance = this;
  }

  /**
   * Get singleton instance
   * @returns ${ClassName}Controller instance
   */
  static getInstance(): ${ClassName}Controller {
    if (!${ClassName}Controller.instance) {
      ${ClassName}Controller.instance = new ${ClassName}Controller();
    }
    return ${ClassName}Controller.instance;
  }

  /**
   * Get all ${fileName}s
   * @param req - Express request
   * @param res - Express response
   * @param _next - Express next function
   */
  async index(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const ret = await ${fileName}Service.getAll(req.query as any);

      if (ret.error) {
        return super.failed(res, 'Failed to get ${fileName}s', ret.message);
      }

      return super.success(res, '${ClassName}s retrieved', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Get a single ${fileName}
   * @param req - Express request
   * @param res - Express response
   * @param _next - Express next function
   */
  async show(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const ret = await ${fileName}Service.getById(req.params.id);

      if (ret.error) {
        return super.failed(res, '${ClassName} not found', ret.message);
      }

      return super.success(res, '${ClassName} retrieved', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Create a new ${fileName}
   * @param req - Express request
   * @param res - Express response
   * @param _next - Express next function
   */
  async store(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const ret = await ${fileName}Service.create(req.body);

      if (ret.error) {
        return super.failed(res, 'Failed to create ${fileName}', ret.message);
      }

      return super.success(res, '${ClassName} created', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Update a ${fileName}
   * @param req - Express request
   * @param res - Express response
   * @param _next - Express next function
   */
  async update(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const ret = await ${fileName}Service.update(req.params.id, req.body);

      if (ret.error) {
        return super.failed(res, 'Failed to update ${fileName}', ret.message);
      }

      return super.success(res, '${ClassName} updated', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }

  /**
   * Delete a ${fileName}
   * @param req - Express request
   * @param res - Express response
   * @param _next - Express next function
   */
  async destroy(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const ret = await ${fileName}Service.delete(req.params.id);

      if (ret.error) {
        return super.failed(res, 'Failed to delete ${fileName}', ret.message);
      }

      return super.success(res, '${ClassName} deleted', ret.data);
    } catch (error: any) {
      return super.internalError(res, error);
    }
  }
}

export default ${ClassName}Controller.getInstance();
`,

  /**
   * Model template
   */
  model: (ClassName, fileName) => `import { Model } from 'mongoose';
import { Schema, BaseSchema } from '../../configs/app.config';
import { I${ClassName} } from '../types/${fileName}.types';

/**
 * ${ClassName} model
 */
const ${ClassName}: Model<I${ClassName}> = BaseSchema<I${ClassName}>('${fileName}s', {
  name: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
  // Add more fields as needed
});

export default ${ClassName};
`,

  /**
   * Service template
   */
  service: (ClassName, fileName, folder) => `import BaseService from '../../../utils/bases/base.service';
import ${ClassName} from '../../models/${fileName}.model';
import { I${ClassName}, ServiceResponse } from '../../types';

/**
 * ${ClassName} Service
 * Manages ${fileName} operations
 */
class ${ClassName}Service extends BaseService<I${ClassName}> {
  private static instance: ${ClassName}Service;

  private constructor() {
    if (${ClassName}Service.instance) {
      return ${ClassName}Service.instance;
    }
    super(${ClassName});
    ${ClassName}Service.instance = this;
  }

  /**
   * Get singleton instance
   * @returns ${ClassName}Service instance
   */
  static getInstance(): ${ClassName}Service {
    if (!${ClassName}Service.instance) {
      ${ClassName}Service.instance = new ${ClassName}Service();
    }
    return ${ClassName}Service.instance;
  }

  /**
   * Custom method example
   * @param id - ${ClassName} ID
   * @returns Service response
   */
  async customMethod(id: string): Promise<ServiceResponse<I${ClassName}>> {
    try {
      const item = await this.model.findById(id);
      if (!item) {
        return { error: true, message: '${ClassName} not found' };
      }

      // Add your custom logic here

      return { error: false, data: item };
    } catch (error: any) {
      return { error: true, message: error.message };
    }
  }
}

export default ${ClassName}Service.getInstance();
`,

  /**
   * Route template
   */
  route: (ClassName, fileName, folder) => `import { Router } from 'express';
import ${fileName}Controller from '../../src/controllers/${folder}/${fileName}.controller';
import * as validation from '../../utils/validations/${fileName}.validation';

const router = Router();

/**
 * @route   GET /${fileName}
 * @desc    Get all ${fileName}s
 * @access  Private
 */
router.get('/', validation.getAll, ${fileName}Controller.index);

/**
 * @route   GET /${fileName}/:id
 * @desc    Get ${fileName} by ID
 * @access  Private
 */
router.get('/:id', validation.getById, ${fileName}Controller.show);

/**
 * @route   POST /${fileName}
 * @desc    Create a new ${fileName}
 * @access  Private
 */
router.post('/', validation.create, ${fileName}Controller.store);

/**
 * @route   PUT /${fileName}/:id
 * @desc    Update ${fileName}
 * @access  Private
 */
router.put('/:id', validation.update, ${fileName}Controller.update);

/**
 * @route   DELETE /${fileName}/:id
 * @desc    Delete ${fileName}
 * @access  Private
 */
router.delete('/:id', validation.destroy, ${fileName}Controller.destroy);

export default router;
`,

  /**
   * Validation template
   */
  validation: (ClassName, fileName) => `import { Request, Response, NextFunction } from 'express';
import { Joi, Validation } from '../../configs/app.config';
import { id } from './app.validation';

/**
 * Validate get all ${fileName}s
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const getAll = (req: Request, res: Response, next: NextFunction): void => {
  Validation(
    req.query,
    {
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      search: Joi.string().optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
    },
    res,
    next
  );
};

/**
 * Validate get ${fileName} by ID
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const getById = (req: Request, res: Response, next: NextFunction): void => {
  Validation(
    req.params,
    {
      id: id.required(),
    },
    res,
    next
  );
};

/**
 * Validate create ${fileName}
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const create = (req: Request, res: Response, next: NextFunction): void => {
  Validation(
    req.body,
    {
      name: Joi.string().min(2).max(100).required(),
      description: Joi.string().max(500).optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
      // Add more validation rules as needed
    },
    res,
    next
  );
};

/**
 * Validate update ${fileName}
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const update = (req: Request, res: Response, next: NextFunction): void => {
  Validation(
    req.params,
    {
      id: id.required(),
    },
    res,
    next
  );

  Validation(
    req.body,
    {
      name: Joi.string().min(2).max(100).optional(),
      description: Joi.string().max(500).optional(),
      status: Joi.string().valid('active', 'inactive').optional(),
      // Add more validation rules as needed
    },
    res,
    next
  );
};

/**
 * Validate delete ${fileName}
 * @param req - Express request
 * @param res - Express response
 * @param next - Next function
 */
const destroy = (req: Request, res: Response, next: NextFunction): void => {
  Validation(
    req.params,
    {
      id: id.required(),
    },
    res,
    next
  );
};

export { getAll, getById, create, update, destroy };
`
};

module.exports = templates;
