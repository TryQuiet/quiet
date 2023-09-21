/**
 * @ipld/dag-cbor puts "types" before "import" in its package.json
 * "exports" field, which seems to throw off the resolver.
 * https://github.com/ipld/js-dag-cbor/blob/83cd99cf8a04a7192d3e3d1e8f3f1c74d2f39a3b/package.json#L50
 *
 * See also the Jest "transformIgnorePatterns" field in this
 * package.json
 */
module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    conditions: ["import", "node"]
  })
}
