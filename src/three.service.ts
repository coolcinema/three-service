import {
  ThreeServiceImplementation,
  CalculatePriceRequest,
  CalculatePriceResponse,
} from "./_gen/grpc/grpc/three";

export class ThreeServiceImpl implements ThreeServiceImplementation {
  async calculatePrice(
    request: CalculatePriceRequest,
  ): Promise<CalculatePriceResponse> {
    console.log(`[Three] CalculatePrice for showtime: ${request.showtimeId}`);
    return {
      amount: 100.0,
      currency: "USD",
    };
  }
}
