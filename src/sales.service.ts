import {
  SalesServiceImplementation,
  CalculatePriceRequest,
  CalculatePriceResponse,
} from "./_gen/grpc/grpc/sales";

export class SalesServiceImpl implements SalesServiceImplementation {
  async calculatePrice(
    request: CalculatePriceRequest,
  ): Promise<CalculatePriceResponse> {
    console.log(`[Sales] CalculatePrice for showtime: ${request.showtimeId}`);
    return {
      amount: 100.0,
      currency: "USD",
    };
  }
}
