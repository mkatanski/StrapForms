declare let window: any;
declare let global: any, jasmine: any, describe: any, clearTest: any, it: any, expect: any;
if (typeof jasmine !== 'undefined') jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;


import { SyncValidator, EResultType, EValidationType, ValidationResult, ValidationData, AsyncValidator} from '../../src/Validators';

// help: https://facebook.github.io/jest/docs/expect.html

const getInputData = (value: string) => ({
  value,
  isPristine: true,
  isTouched: false,
  isValid: false,
})

describe('SyncValidator', () => {

  it('should import the component', () => {
		expect(SyncValidator).not.toBe(undefined);
  });

  it('should create instance', () => {
    const validator = new SyncValidator('input1', () => <ValidationResult>{ resultType: EResultType.SUCCESS })
    expect(validator).not.toBe(undefined)
  })

  it('should have default precedence', () => {
    const validator = new SyncValidator('input1', () => <ValidationResult>{ resultType: EResultType.SUCCESS })
    expect(validator.precedence).toBe(0)
  })

  it('should have custom precedence', () => {
    const validator = new SyncValidator('input1', () => <ValidationResult>{ resultType: EResultType.SUCCESS }, 10)
    expect(validator.precedence).toBe(10)
  })

  it('should have correct target name', () => {
    const validator = new SyncValidator('input1', () => <ValidationResult>{ resultType: EResultType.SUCCESS })
    expect(validator.targetName).toBe('input1')
  })

  it('should be type of sync validator', () => {
    const validator = new SyncValidator('input1', () => <ValidationResult>{ resultType: EResultType.SUCCESS })
    expect(validator.type).toBe(EValidationType.SYNC)
  })

  it('should return correct data as result', () => {
    const validator = new SyncValidator('input', () => <ValidationResult>{
      resultType: EResultType.SUCCESS,
      code: 12,
      message: 'this will be always success'
    }, 1)
    const input = getInputData('test value')

    const promise = validator.validate(input, { 'input1': input, }, () => { })
    return promise.then((validationData) => {
      expect(validationData.result).toBe(EResultType.SUCCESS)
      expect(validationData.message).toBe('this will be always success')
      expect(validationData.code).toBe(12)
      expect(validationData.value).toBe('test value')
      expect(validationData.validator.targetName).toBe('input')
      expect(validationData.validator.validatorType).toBe(EValidationType.SYNC)
      expect(validationData.validator.precedence).toBe(1)
    })
  })

  it('should validate', () => {
    let input
    const validator = new SyncValidator('input1', (data) => {
      if (data.value === 'invalid') {
        return {
          resultType: EResultType.ERROR,
          code: 100,
          message: 'invalid data',
        }
      }

      return { resultType: EResultType.SUCCESS }
    })

    input = getInputData('valid')
    const promiseValid = validator.validate(input, { 'input1': input, }, () => { })
    input = getInputData('invalid')
    const promiseInvalid = validator.validate(input, { 'input1': input, }, () => { })

    return Promise.all([promiseValid, promiseInvalid]).then((values) => {

      const invalid = values.filter((value) => value.result === EResultType.ERROR)
      expect(invalid.length).toBe(1)

      expect(values[0].result).toBe(EResultType.SUCCESS)
      expect(values[0].value).toBe('valid')
      expect(values[0].message).toBe(undefined)
      expect(values[0].code).toBe(undefined)
      expect(values[0].validator.targetName).toBe('input1')
      expect(values[0].validator.validatorType).toBe(EValidationType.SYNC)
      expect(values[0].validator.precedence).toBe(0)

      expect(values[1].result).toBe(EResultType.ERROR)
      expect(values[1].value).toBe('invalid')
      expect(values[1].message).toBe('invalid data')
      expect(values[1].code).toBe(100)
      expect(values[1].validator.targetName).toBe('input1')
      expect(values[1].validator.validatorType).toBe(EValidationType.SYNC)
      expect(values[1].validator.precedence).toBe(0)
    })
  })
})

describe('AsyncValidator', () => {

  it('should import the component', () => {
		expect(AsyncValidator).not.toBe(undefined);
  });

  it('should create instance', () => {
    const validator = new AsyncValidator('input1', () =>
      new Promise((resolve) => { resolve(<ValidationResult>{ resultType: EResultType.SUCCESS }) }))
    expect(validator).not.toBe(undefined)
  })

  it('should have default precedence', () => {
    const validator = new AsyncValidator('input1', () =>
    new Promise((resolve) => { resolve(<ValidationResult>{ resultType: EResultType.SUCCESS }) }))
    expect(validator.precedence).toBe(0)
  })

  it('should have custom precedence', () => {
    const validator = new AsyncValidator('input1', () =>
    new Promise((resolve) => { resolve(<ValidationResult>{ resultType: EResultType.SUCCESS }) }), 10)
    expect(validator.precedence).toBe(10)
  })

  it('should have correct target name', () => {
    const validator = new AsyncValidator('input1', () =>
    new Promise((resolve) => { resolve(<ValidationResult>{ resultType: EResultType.SUCCESS }) }))
    expect(validator.targetName).toBe('input1')
  })

  it('should be type of async validator', () => {
    const validator = new AsyncValidator('input1', () =>
    new Promise((resolve) => { resolve(<ValidationResult>{ resultType: EResultType.SUCCESS }) }))
    expect(validator.type).toBe(EValidationType.ASYNC)
  })

  it('should return correct data as result', () => {
    const validator = new AsyncValidator('input', () => new Promise((resolve) => {
      resolve(<ValidationResult>{
        resultType: EResultType.SUCCESS,
        code: 12,
        message: 'this will be always success'
      })
    }), 1)

    const input = getInputData('test value')

    const promise = validator.validate(input, { 'input': input, }, () => { })
    return promise.then((validationData) => {
      expect(validationData.result).toBe(EResultType.SUCCESS)
      expect(validationData.message).toBe('this will be always success')
      expect(validationData.code).toBe(12)
      expect(validationData.value).toBe('test value')
      expect(validationData.validator.targetName).toBe('input')
      expect(validationData.validator.validatorType).toBe(EValidationType.ASYNC)
      expect(validationData.validator.precedence).toBe(1)
    })
  })

  it('should validate', () => {
    let input

    const validator = new AsyncValidator('input1', (data) => new Promise((resolve) => {
      if (data.value === 'invalid') {
        resolve({
          resultType: EResultType.ERROR,
          code: 100,
          message: 'invalid data',
        })
      }

      resolve({ resultType: EResultType.SUCCESS })
    }))

    input = getInputData('valid')
    const promiseValid = validator.validate(input, { 'input1': input, }, () => { })
    input = getInputData('invalid')
    const promiseInvalid = validator.validate(input, { 'input1': input, }, () => { })

    return Promise.all([promiseValid, promiseInvalid]).then((values) => {

      const invalid = values.filter((value) => value.result === EResultType.ERROR)
      expect(invalid.length).toBe(1)

      expect(values[0].result).toBe(EResultType.SUCCESS)
      expect(values[0].value).toBe('valid')
      expect(values[0].message).toBe(undefined)
      expect(values[0].code).toBe(undefined)
      expect(values[0].validator.targetName).toBe('input1')
      expect(values[0].validator.validatorType).toBe(EValidationType.ASYNC)
      expect(values[0].validator.precedence).toBe(0)

      expect(values[1].result).toBe(EResultType.ERROR)
      expect(values[1].value).toBe('invalid')
      expect(values[1].message).toBe('invalid data')
      expect(values[1].code).toBe(100)
      expect(values[1].validator.targetName).toBe('input1')
      expect(values[1].validator.validatorType).toBe(EValidationType.ASYNC)
      expect(values[1].validator.precedence).toBe(0)
    })
  })
})
