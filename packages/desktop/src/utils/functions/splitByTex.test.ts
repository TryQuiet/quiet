import { displayMathRegex, splitByTex } from './splitByTex'

describe('splitByTex', () => {
  it('splits math and text', () => {
    const result = splitByTex(
      String.raw`Hello! Does in-line LaTeX work? $$\sum_{i=0}^n i = \frac{n(n+1)}{2}$$ $$R(t)= A \left(\frac{E_0}{\rho_0}\right)^{1/5}t^{2/5}$$ Text at the end`,
      displayMathRegex
    )
    expect(result).toStrictEqual([
      'Hello! Does in-line LaTeX work?',
      String.raw`$$\sum_{i=0}^n i = \frac{n(n+1)}{2}$$`,
      String.raw`$$R(t)= A \left(\frac{E_0}{\rho_0}\right)^{1/5}t^{2/5}$$`,
      'Text at the end',
    ])
  })
})
