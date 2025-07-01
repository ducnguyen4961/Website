export async function POST(req) {
  try {
    const body = await req.json();

    const { house_device, slaveID, username, email } = body;

    const response = await fetch("https://your-api-gateway-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Có thể cần Authorization nếu API cần
      },
      body: JSON.stringify({ house_device, slaveID, username }),
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ body: result }, { status: 500 });
    }

    return Response.json({ body: "OK" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ body: "Internal server error" }, { status: 500 });
  }
}
