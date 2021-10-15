export class Subscriber {
  constructor({ name, job = () => {} }) {
    this.name = name;
    this.job = job
  }

  isTriggeredBy(event) {
    return true
  }

  doWork(event) {
    console.log(this.name, 'doing work for ', event.name)
    return this.job(event);
  }

  static parseFrom(codebase) {
    return [];
  }
}