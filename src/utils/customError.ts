class CustomError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, options: { statusCode: number; details?: any } = { statusCode: 400 }) {
    super(message);
    this.statusCode = options.statusCode;
    this.details = options.details;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export default CustomError;