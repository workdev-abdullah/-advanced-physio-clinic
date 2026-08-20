import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="overflow-hidden">

      {/* ================= HERO ================= */}
      <section className="bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-stretch">

          {/* LEFT HERO CARD */}
          <div className="
            rounded-3xl p-10
            bg-white/90 dark:bg-slate-900/80
            backdrop-blur
            border border-gray-200 dark:border-slate-700
            shadow-xl
            flex flex-col justify-between
            transition-all duration-300
            hover:-translate-y-1 hover:shadow-green-500/10
          ">
            {/* Badge */}
            <span className="
              inline-block w-fit px-4 py-1.5 rounded-full
              text-xs font-semibold tracking-wide
              bg-green-100 text-green-700
              dark:bg-green-900/40 dark:text-green-400
            ">
              Trusted Physiotherapy Care
            </span>

            {/* Title */}
            <h1 className="mt-6 text-3xl font-extrabold leading-snug text-gray-900 dark:text-white">
              Advance Physiotherapy <br />
              <span className="text-green-600 dark:text-green-400">
                Clinic
              </span>
            </h1>

            {/* Description */}
            <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300 max-w-lg">
              Personalized physiotherapy treatment designed to relieve pain,
              restore natural movement, and improve long-term quality of life
              through evidence-based care.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex gap-4">
              <Link
                to="/slots?visitType=clinic"
                className="
                  px-6 py-3 rounded-xl font-semibold
                  bg-green-600 text-white
                  hover:bg-green-700 transition
                "
              >
                Clinic Visit
              </Link>

              <Link
                to="/slots?visitType=home"
                className="
                  px-6 py-3 rounded-xl font-semibold
                  border border-green-600 text-green-600
                  hover:bg-green-50 dark:hover:bg-green-900/20
                  transition
                "
              >
                Home Visit
              </Link>
            </div>
          </div>

          {/* RIGHT HERO CARD */}
          <div className="
            rounded-3xl p-10
            bg-white/90 dark:bg-slate-900/80
            backdrop-blur
            border border-gray-200 dark:border-slate-700
            shadow-xl
            flex flex-col justify-center
            transition-all duration-300
            hover:-translate-y-1 hover:shadow-green-500/10
          ">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Why Choose Us
            </h3>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Trusted care, modern approach, and patient-first treatment.
            </p>

            <ul className="mt-6 space-y-4">
              {[
                "Experienced & certified physiotherapist",
                "Evidence-based treatment protocols",
                "Clinic & home visit flexibility",
                "Digital booking, payment & receipts",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="
                    flex h-6 w-6 items-center justify-center
                    rounded-full text-sm font-bold
                    bg-green-100 text-green-600
                    dark:bg-green-900/40 dark:text-green-400
                  ">
                    ✓
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ================= CONDITIONS ================= */}
      <section className="bg-slate-100 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Common Conditions We Treat
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Back Pain", text: "Postural, muscular & spine-related conditions." },
              { title: "Neck Pain", text: "Cervical stiffness, nerve pain & strain." },
              { title: "Knee Pain", text: "Arthritis, sports injury & recovery care." },
            ].map((item) => (
              <div
                key={item.title}
                className="
                  rounded-2xl p-6
                  bg-white dark:bg-slate-900
                  border border-gray-200 dark:border-slate-700
                  shadow-md
                  transition-all duration-300
                  hover:-translate-y-1 hover:shadow-lg
                "
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= DOCTOR ================= */}
      <section className="bg-white dark:bg-slate-900 border-t dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dr. Ahad Sk (PT)
          </h3>
          <p className="text-gray-500 mt-2">
            Reg No: 20013000306
          </p>
          <p className="text-gray-500 mt-1">
            Roy Medical Hall, Chanchal Hospital Gate
          </p>
        </div>
      </section>

    </div>
  );
}
