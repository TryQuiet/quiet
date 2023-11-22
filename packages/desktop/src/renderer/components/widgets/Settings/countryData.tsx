import countryData from 'country-region-data'
import * as R from 'ramda'

export default R.reduce(
    (acc, countryMeta: any) => R.merge(acc, { [countryMeta.countryName]: countryMeta.regions.map(R.prop('name')) }),
    {}
)(countryData)
