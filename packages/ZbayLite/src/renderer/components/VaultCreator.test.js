/* eslint import/first: 0 */
import React from 'react'
import { shallow } from 'enzyme'
import * as R from 'ramda'

import { mockClasses } from '../../shared/testing/mocks'
import { VaultCreator, formSchema, validateForm } from './VaultCreator'

describe('VaultCreator', () => {
  const validValues = {
    name: 'Mercury',
    password: 'thisisatestpassword',
    repeat: 'thisisatestpassword'
  }

  it('renders component', () => {
    const result = shallow(
      <VaultCreator
        classes={mockClasses}
        onSend={jest.fn()}
      />
    )
    expect(result).toMatchSnapshot()
  })

  it('passes initial values', () => {
    const result = shallow(
      <VaultCreator
        classes={mockClasses}
        onSend={jest.fn()}
        initialValues={validValues}
      />
    )
    expect(result).toMatchSnapshot()
  })

  describe('password', () => {
    it('is longer than 6 characters', async () => {
      expect.assertions(1)
      try {
        await formSchema.validate({
          ...validValues,
          password: 'pass'
        })
      } catch (err) {
        expect(err).toMatchSnapshot()
      }
    })

    it('is present', async () => {
      expect.assertions(1)
      try {
        await formSchema.validate(R.omit(['password'], validValues))
      } catch (err) {
        expect(err).toMatchSnapshot()
      }
    })
  })

  describe('repeat', () => {
    it('is longer than 6 characters', async () => {
      expect.assertions(1)
      try {
        await formSchema.validate({
          ...validValues,
          repeat: 'pass'
        })
      } catch (err) {
        expect(err).toMatchSnapshot()
      }
    })

    it('is present', async () => {
      expect.assertions(1)
      try {
        await formSchema.validate(R.omit(['repeat'], validValues))
      } catch (err) {
        expect(err).toMatchSnapshot()
      }
    })
  })

  it('repeat and password are the same', () => {
    const errors = validateForm({
      name: 'Mercury',
      password: 'somePassword',
      repeat: 'anotherPassword'
    })
    expect(errors).toMatchSnapshot()
  })
})
