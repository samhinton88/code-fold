export class Event {
  constructor({ sourceFile, name, triggerTest, pathPattern }) {
    this.sourceFile = sourceFile
    this.name = name
    this.triggerTest = triggerTest
    this.pathPattern = pathPattern
  }

  test() {
    return this.triggerTest();
  }

  static parseFrom(codebase) {
    return [];
  }
}