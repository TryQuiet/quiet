import debug from 'debug'

 const resultLogger = () => {
   const module = 'test'
   return Object.assign(debug(`identity:${module}`), {
     failed: debug(`identity:${module}:failed`),
     passed: debug(`identity:${module}:passed`)
   })
 }

 export default resultLogger
 