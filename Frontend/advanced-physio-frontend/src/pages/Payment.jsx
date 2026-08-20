import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function Payment() {
  const [params] = useSearchParams();
  const slotId = params.get("slotId");

  useEffect(() => {
    const patientData = JSON.parse(
      sessionStorage.getItem("patientData")
    );

    const createOrder = async () => {
      const res = await api.post("/payment/create-order", {
        slotId,
        amount: 400,
        ...patientData,
      });

      const options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: "INR",
        order_id: res.data.orderId,

        handler: function () {
          // 🔐 Save order reference temporarily
          sessionStorage.setItem(
            "orderId",
            res.data.orderId
          );

          window.location.href = "/success";
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    };

    createOrder();
  }, [slotId]);

  return (
    <p className="text-center mt-10">
      Redirecting to payment…
    </p>
  );
}
