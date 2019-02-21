
export class Printer {
 public log(...args) {
    console.log(...args);
 }
 public error(...args) {
     console.error(...args);
 }
}

const printer = new Printer();

export default printer;