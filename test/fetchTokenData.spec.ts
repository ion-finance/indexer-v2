import fetchTokenData from '../src/utils/fetchTokenData'

describe('fetchTokenData', () => {
  test('should fetch token data', async () => {
    const res = await fetchTokenData(
      'EQCUSDFlV_fD20FmFYTeAnEhcfhB0XhFuhV2GszqgZA_l9fi',
    )

    expect(res.metadata.symbol).toEqual('iUSDT')
    expect(res.metadata.decimals).toEqual('6')
  })
})
