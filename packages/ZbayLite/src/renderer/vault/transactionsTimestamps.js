import * as R from 'ramda'

const _entryToTxn = tnx => {
  const entryObj = tnx.toObject()
  return {
    [entryObj.properties.title]: entryObj.properties.timestamp
  }
}

const processEntries = R.compose(
  R.reverse,
  R.map(_entryToTxn)
)

export default vault => {
  const addTransaction = async (txn, timestamp) => {
    await vault.withWorkspace(workspace => {
      const [txns] = workspace.archive.findGroupsByTitle('TxnTs')
      const [transaction] = txns.getEntries().filter(g => g.toObject().properties.title === txn)
      if (!transaction) {
        txns
          .createEntry(txn)
          .setProperty('timestamp', timestamp.toString())
      }
      workspace.save()
    })
  }
  const listTransactions = async () => {
    let txnsEntries = []
    await vault.withWorkspace(workspace => {
      const [txns] = workspace.archive.findGroupsByTitle('TxnTs')
      txnsEntries = txns ? txns.getEntries() : []
    })
    return processEntries(txnsEntries)
  }

  return {
    listTransactions,
    addTransaction
  }
}
