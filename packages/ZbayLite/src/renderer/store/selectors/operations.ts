import { OperationsStore } from "./../handlers/operations";

const operations = (s): OperationsStore => s.operations as OperationsStore;

export default {
  operations,
};
