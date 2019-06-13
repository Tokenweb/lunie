"use strict"

import Vuelidate from "vuelidate"
import { shallowMount, createLocalVue } from "@vue/test-utils"
import ModalPropose from "src/components/governance/ModalPropose"

describe(`ModalPropose`, () => {
  let wrapper, $store

  const localVue = createLocalVue()
  localVue.use(Vuelidate)
  localVue.directive(`focus`, () => {})

  const inputs = {
    amount: 15,
    title: `A new text proposal for Cosmos`,
    description: `a valid description for the proposal`
  }

  beforeEach(async () => {
    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(),
      getters: {
        session: { signedIn: true },
        connection: { connected: true },
        liquidAtoms: 200000000,
        wallet: {
          balances: [{ denom: `uatom`, amount: `20000000` }],
          loading: false
        }
      }
    }
    wrapper = shallowMount(ModalPropose, {
      localVue,
      mocks: {
        $store
      },
      propsData: {
        denom: `uatom`
      },
      sync: false
    })
  })

  it(`should display proposal modal form`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`opens`, () => {
    const $refs = { actionModal: { open: jest.fn() } }
    ModalPropose.methods.open.call({ $refs })
    expect($refs.actionModal.open).toHaveBeenCalled()
  })

  it(`clears on close`, () => {
    const self = {
      $v: { $reset: jest.fn() },
      title: `title`,
      description: `description`,
      amount: 10
    }
    ModalPropose.methods.clear.call(self)
    expect(self.$v.$reset).toHaveBeenCalled()
    expect(self.title).toBe(``)
    expect(self.description).toBe(``)
    expect(self.amount).toBe(0)
  })

  describe(`validation`, () => {
    describe(`fails`, () => {
      it(`with the default values`, () => {
        expect(wrapper.vm.validateForm()).toBe(false)
      })

      it(`if the amount for initial deposit is higher than the user's balance`, async () => {
        wrapper.setData({ amount: 250 })
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.validateForm()).toBe(false)
      })

      it(`if the user doesn't have the deposit coin`, async () => {
        const otherCoins = [
          {
            amount: `20`,
            denom: `otherCoin`
          }
        ]
        wrapper.vm.wallet.balances = otherCoins
        wrapper.setData(inputs)
        wrapper.setData({ amount: 25 })
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.validateForm()).toBe(false)
      })

      it(`if title is blank`, () => {
        wrapper.setData(inputs)
        wrapper.setData({ title: `     ` })
        expect(wrapper.vm.validateForm()).toBe(false)
      })

      it(`if description is blank`, () => {
        wrapper.setData({ description: `     ` })
        expect(wrapper.vm.validateForm()).toBe(false)
      })

      it(`if title is too long disable submit button and show error message`, async () => {
        wrapper.setData({ title: `x`.repeat(65) })
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.validateForm()).toBe(false)
      })

      it(`if description is too long disable submit button and show error message`, async () => {
        wrapper.setData({ description: `x`.repeat(201) })
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.validateForm()).toBe(false)
      })

      it(`if proposal type is invalid`, () => {
        wrapper.setData(inputs)
        wrapper.setData({ type: `Other` })
        expect(wrapper.vm.validateForm()).toBe(false)
      })
    })

    describe(`successful`, () => {
      it(`if the user has enough balance and the fields are within the length ranges`, async () => {
        wrapper.vm.wallet.balances = [{ denom: `uatom`, amount: `20000000` }]
        wrapper.setData(inputs)
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.validateForm()).toBe(true)
      })
    })
  })
})
