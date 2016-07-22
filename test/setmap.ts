
/// <reference path="typings/index.d.ts" />

import { expect } from "chai"
import { SetMap } from "../src/setmap"

describe('a set map', () => {
 
  it('does not report nonexistent values to be there', () => {
    const setmap = new SetMap()
    expect(setmap.has(['one','two'])).to.be.false
    expect(setmap.has(['one','two','three'])).to.be.false
    expect(setmap.has([])).to.be.false
  })
  
  it('only reports setted values to be there', () => {
    const setmap = new SetMap()
    setmap.set(['one','two'], 'someval')
    expect(setmap.has(['one','two'])).to.be.true
    expect(setmap.has(['foo','bar'])).to.be.false
    setmap.set(['one','two','three'], 'foobar')
    expect(setmap.has(['one','two','three'])).to.be.true
    expect(setmap.has(['baz','bar'])).to.be.false
    setmap.set([], 'anotherval')
    expect(setmap.has([])).to.be.true
    expect(setmap.has(['another','set'])).to.be.false
  })

  it('is able have values seted and reports them to be present', () => {
    const setmap = new SetMap()
    setmap.set(['one','two'], 'someval')
    expect(setmap.has(['one','two'])).to.be.true
    setmap.set(['one','two','three'], 'foobar')
    expect(setmap.has(['one','two','three'])).to.be.true
    setmap.set([], 'anotherval')
    expect(setmap.has([])).to.be.true
  })

  it('returns the correct value for a given set', () => {
    const setmap = new SetMap()
    setmap.set(['one'], 'hello')
    expect(setmap.get(['one'])).to.equal('hello')
    setmap.set(['four','two'], 'someval')
    expect(setmap.get(['four','two'])).to.equal('someval')
    setmap.set(['one','two','three'], 'foobar')
    expect(setmap.get(['one','two','three'])).to.equal('foobar')
    setmap.set([], 'anotherval')
    expect(setmap.get([])).to.equal('anotherval')

  })
  
})

