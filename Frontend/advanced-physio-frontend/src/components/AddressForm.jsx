export default function AddressForm({ address, setAddress }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Home Address</h3>

      <input
        type="text"
        placeholder="House / Street"
        className="input"
        value={address.house}
        onChange={(e) =>
          setAddress({ ...address, house: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Area / Locality"
        className="input"
        value={address.area}
        onChange={(e) =>
          setAddress({ ...address, area: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="City"
        className="input"
        value={address.city}
        onChange={(e) =>
          setAddress({ ...address, city: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Pincode"
        className="input"
        value={address.pincode}
        onChange={(e) =>
          setAddress({ ...address, pincode: e.target.value })
        }
      />
    </div>
  );
}
