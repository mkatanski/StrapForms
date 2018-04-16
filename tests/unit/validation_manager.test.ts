declare let window: any;
declare let global: any, jasmine: any, describe: any, clearTest: any, it: any, expect: any, beforeAll: any;
if (typeof jasmine !== 'undefined') jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;


import { IValidationManager, ValidationManager } from '../../src/ValidationManager'
import { EventsManager, IEventsManager } from '../../src/EventsManager'
import { SyncValidator, AsyncValidator, ValidationResult, EResultType } from '../../src/Validators'

// help: https://facebook.github.io/jest/docs/expect.html

type CheckData = {
  input: string
  value1: string
  value2: string
  errors: number
  success: number
  warnings: number
  total: number
}

const getInputData = (value: string) => ({
  value,
  isPristine: true,
  isTouched: false,
  isValid: false,
})

describe('ValidationManager', () => {
  const getResult = (value: string, type: EResultType, mode: string = '') => {
    switch (type) {
      case EResultType.ERROR:
        return value === `invalid${mode}` ? EResultType.ERROR : EResultType.SUCCESS
      case EResultType.WARNING:
        return value === `warn${mode}` ? EResultType.WARNING : EResultType.SUCCESS
      default:
        return EResultType.SUCCESS
    }
  }

  const getSyncValidator = (inputName: string, type: EResultType) =>
    new SyncValidator(inputName, (data) =>
      <ValidationResult>{ resultType: getResult(data.value, type) })

  const getAsyncValidator = (inputName: string, type: EResultType) =>
    new AsyncValidator(inputName, (data) => new Promise((resolve) => {
      resolve({ resultType: getResult(data.value, type, '_async') })
    }))

  let manager: IValidationManager
  let eventsManager: EventsManager

  it('should import the component', () => {
		expect(ValidationManager).not.toBe(undefined);
  })

  it('should create instance', () => {
    const eventsManager = new EventsManager()
    const manager = new ValidationManager({ eventsManager })
    expect(manager).not.toBe(undefined)
    expect(manager.isValidating).toBe(false)
  })

  it('should add and remove validators', () => {
    const eventsManager = new EventsManager()
    const manager = new ValidationManager({ eventsManager })
    expect(manager.validators).toEqual([])

    const validator1 = new SyncValidator('input1', () => <ValidationResult>{ resultType: EResultType.SUCCESS })
    const validator2 = new SyncValidator('input2', () => <ValidationResult>{ resultType: EResultType.SUCCESS })
    const validator3 = new SyncValidator('input2', () => <ValidationResult>{ resultType: EResultType.SUCCESS })
    const validator4 = new SyncValidator('input3', () => <ValidationResult>{ resultType: EResultType.SUCCESS })
    manager.addValidator(validator1)
    manager.addValidator(validator2)
    manager.addValidator(validator3)
    manager.addValidator(validator4)

    expect(manager.validators.length).toBe(4)
    expect(manager.validators[0].targetName).toBe('input1')
    expect(manager.validators[1].targetName).toBe('input2')
    expect(manager.validators[2].targetName).toBe('input2')
    expect(manager.validators[3].targetName).toBe('input3')

    manager.removeValidator('input2')

    expect(manager.validators.length).toBe(2)
    expect(manager.validators[0].targetName).toBe('input1')
    expect(manager.validators[1].targetName).toBe('input3')

    manager.clearValidators()
    expect(manager.validators.length).toBe(0)
  })

  describe('on specific target', () => {

    const checkInputs = (cd: CheckData) => {
      return manager.validateTarget(cd.input, {
        'input1': { value: cd.value1, isPristine: true, isTouched: false, isValid: false },
        'input2': { value: cd.value2, isPristine: true, isTouched: false, isValid: false },
      }).then(results => {
        const errors = results.filter(res => res.result === EResultType.ERROR)
        const success = results.filter(res => res.result === EResultType.SUCCESS)
        const warnings = results.filter(res => res.result === EResultType.WARNING)

        expect(errors.length).toBe(cd.errors)
        expect(success.length).toBe(cd.success)
        expect(warnings.length).toBe(cd.warnings)

        // all sync validation passed so the result shoould be both async and sync
        expect(results.length).toBe(cd.total)
      })
    }

    const syncValidatorsInput1 = 3
    const asyncValidatorsInput1 = 4
    const syncValidatorsInput2 = 1
    const asyncValidatorsInput2 = 3

    const validatorsTotalInput1 = syncValidatorsInput1 + asyncValidatorsInput1
    const validatorsTotalInput2 = syncValidatorsInput2 + asyncValidatorsInput2

    beforeAll(() => {
      eventsManager = new EventsManager()
      manager = new ValidationManager({ eventsManager})

      const validators = [
        getSyncValidator('input1', EResultType.ERROR),
        getSyncValidator('input1', EResultType.WARNING),
        getSyncValidator('input1', EResultType.ERROR),

        getSyncValidator('input2', EResultType.ERROR),

        getAsyncValidator('input1', EResultType.ERROR),
        getAsyncValidator('input1', EResultType.ERROR),
        getAsyncValidator('input1', EResultType.WARNING),
        getAsyncValidator('input1', EResultType.ERROR),

        getAsyncValidator('input2', EResultType.ERROR),
        getAsyncValidator('input2', EResultType.ERROR),
        getAsyncValidator('input2', EResultType.WARNING),
      ]

      validators.forEach(v => { manager.addValidator(v) })
    })

    describe('with default settings', () => {

      it('should return SUCCESS only for input1', () => {
        return checkInputs({
          input: 'input1',
          value1: 'valid',
          value2: 'invalid',
          errors: 0,
          success: validatorsTotalInput1,
          warnings: 0,
          total: validatorsTotalInput1
        })
      })

      it('should return ERRORS results for input1', () => {
        return checkInputs({
          input: 'input1',
          value1: 'invalid',
          value2: 'invalid',
          errors: 2,
          success: 1,
          warnings: 0,
          total: syncValidatorsInput1
        })
      })

      it('should return WARNING results for input1', () => {
        return checkInputs({
          input: 'input1',
          value1: 'warn',
          value2: 'warn',
          errors: 0,
          success: validatorsTotalInput1 - 1,
          warnings: 1,
          total: validatorsTotalInput1
        })
      })

      it('should return SUCCESS results for input2', () => {
        return checkInputs({
          input: 'input2',
          value1: 'invalid',
          value2: 'valid',
          errors: 0,
          success: validatorsTotalInput2,
          warnings: 0,
          total: validatorsTotalInput2
        })
      })

      it('should return ERRORS results for input2', () => {
          return checkInputs({
            input: 'input2',
            value1: 'invalid',
            value2: 'invalid',
            errors: 1,
            success: syncValidatorsInput2 - 1,
            warnings: 0,
            total: syncValidatorsInput2
          })
      })

      it('should return no WARNING results for input2', () => {
        return checkInputs({
          input: 'input2',
          value1: 'warn',
          value2: 'warn',
          errors: 0,
          success: validatorsTotalInput2,
          warnings: 0,
          total: validatorsTotalInput2
        })
      })

      it('should asynchrounously return ERROR result for input1', () => {
        return checkInputs({
          input: 'input1',
          value1: 'invalid_async',
          value2: 'invalid_async',
          errors: 3,
          success: 4,
          warnings: 0,
          total: validatorsTotalInput1
        })
      })

      it('should asynchrounously return ERROR result for input2', () => {
        return checkInputs({
          input: 'input2',
          value1: 'invalid_async',
          value2: 'invalid_async',
          errors: 2,
          success: 2,
          warnings: 0,
          total: validatorsTotalInput2
        })
      })

      it('should asynchrounously return WARNING result for input1', () => {
        return checkInputs({
          input: 'input1',
          value1: 'warn_async',
          value2: 'warn_async',
          errors: 0,
          success: 6,
          warnings: 1,
          total: validatorsTotalInput1
        })
      })

      it('should asynchrounously return WARNING result for input2', () => {
        return checkInputs({
          input: 'input2',
          value1: 'warn_async',
          value2: 'warn_async',
          errors: 0,
          success: 3,
          warnings: 1,
          total: validatorsTotalInput2
        })
      })


    })

    describe('with custom break on sync error', () => {

      beforeAll(() => {
        manager.breakOnSyncError = [EResultType.WARNING]
      })

      it('should return ERRORS results for input1', () => {
        return checkInputs({
          input: 'input1',
          value1: 'invalid',
          value2: 'invalid',
          errors: 2,
          success: 5,
          warnings: 0,
          total: validatorsTotalInput1
        })
      })

      it('should return WARNING results for input1', () => {
        return checkInputs({
          input: 'input1',
          value1: 'warn',
          value2: 'warn',
          errors: 0,
          success: 2,
          warnings: 1,
          total: syncValidatorsInput1
        })
      })

    })

  })

  describe('on all targets', () => {

    const checkInputs = (cd: CheckData) => {
      return manager.validateAll({
        'input1': { value: cd.value1, isPristine: true, isTouched: false, isValid: false },
        'input2': { value: cd.value2, isPristine: true, isTouched: false, isValid: false },
      }).then(results => {
        const errors = results.filter(res => res.result === EResultType.ERROR)
        const success = results.filter(res => res.result === EResultType.SUCCESS)
        const warnings = results.filter(res => res.result === EResultType.WARNING)

        expect(errors.length).toBe(cd.errors)
        expect(success.length).toBe(cd.success)
        expect(warnings.length).toBe(cd.warnings)

        // all sync validation passed so the result shoould be both async and sync
        expect(results.length).toBe(cd.total)
      })
    }

    const syncValidatorsInput1 = 2
    const asyncValidatorsInput1 = 2
    const syncValidatorsInput2 = 1
    const asyncValidatorsInput2 = 2

    const validatorsTotalInput1 = syncValidatorsInput1 + asyncValidatorsInput1
    const validatorsTotalInput2 = syncValidatorsInput2 + asyncValidatorsInput2

    beforeAll(() => {
      eventsManager = new EventsManager()
      manager = new ValidationManager({
        eventsManager,
      })

      const validators = [
        getSyncValidator('input1', EResultType.ERROR),
        getSyncValidator('input1', EResultType.WARNING),
        getSyncValidator('input2', EResultType.ERROR),

        getAsyncValidator('input1', EResultType.ERROR),
        getAsyncValidator('input1', EResultType.WARNING),
        getAsyncValidator('input2', EResultType.ERROR),
        getAsyncValidator('input2', EResultType.WARNING),
      ]

      validators.forEach(v => { manager.addValidator(v) })
    })

    describe('with default settings', () => {

      it('should return SUCCESS for all inputs', () => {
        return checkInputs({
          input: 'input1',
          value1: 'valid',
          value2: 'valid',
          errors: 0,
          success: validatorsTotalInput1 + validatorsTotalInput2,
          warnings: 0,
          total: validatorsTotalInput1 + validatorsTotalInput2
        })
      })

      it('should return ERROR for all inputs', () => {
        return checkInputs({
          input: 'input1',
          value1: 'invalid',
          value2: 'invalid',
          errors: 2,
          success: 1,
          warnings: 0,
          total: syncValidatorsInput1 + syncValidatorsInput2
        })
      })

      it('should return WARNING for all inputs', () => {
        return checkInputs({
          input: 'input1',
          value1: 'warn',
          value2: 'warn',
          errors: 0,
          success: 6,
          warnings: 1,
          total: validatorsTotalInput1 + validatorsTotalInput2
        })
      })

      it('should return ERROR from async for all inputs', () => {
        return checkInputs({
          input: 'input1',
          value1: 'invalid_async',
          value2: 'invalid_async',
          errors: 2,
          success: 5,
          warnings: 0,
          total: validatorsTotalInput1 + validatorsTotalInput2
        })
      })

      it('should return WARNING from async for all inputs', () => {
        return checkInputs({
          input: 'input1',
          value1: 'warn_async',
          value2: 'warn_async',
          errors: 0,
          success: 5,
          warnings: 2,
          total: validatorsTotalInput1 + validatorsTotalInput2
        })
      })
    })

    describe('with custom break on sync error', () => {

      beforeAll(() => {
        manager.breakOnSyncError = [EResultType.WARNING]
      })

      it('should return ERROR for all inputs', () => {
        return checkInputs({
          input: 'input1',
          value1: 'invalid',
          value2: 'invalid',
          errors: 2,
          success: 5,
          warnings: 0,
          total: validatorsTotalInput1 + validatorsTotalInput2
        })
      })

      it('should return WARNING for all inputs', () => {
        return checkInputs({
          input: 'input1',
          value1: 'warn',
          value2: 'warn',
          errors: 0,
          success: 2,
          warnings: 1,
          total: syncValidatorsInput1 + syncValidatorsInput2
        })
      })
    })

  })
})
