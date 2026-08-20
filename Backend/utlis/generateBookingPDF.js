import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const generateBookingPDF = (booking) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!booking._id) {
        throw new Error("booking._id is required for PDF generation");
      }

      const baseDir = path.join(process.cwd(), "uploads", "receipts");
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      const fileName = `${booking._id}.pdf`;
      const absoluteFilePath = path.join(baseDir, fileName);

      const doc = new PDFDocument({
        size: "A4",
        margin: 42,
      });

      const stream = fs.createWriteStream(absoluteFilePath);
      doc.pipe(stream);

      /* ================= FORMAT DATE & TIME + CONSOLE LOG ================= */
      let dateStr = "N/A";
      let timeStr = "As per schedule";

      // Enhanced debug logging
      console.log("📋 PDF Generation Started for Booking:", booking._id);
      console.log("🔍 Booking Analysis:", {
        visitType: booking.visitType,
        hasSlotId: !!booking.slotId,
        slotIdType: typeof booking.slotId,
        slotIdValue: booking.slotId,
        isMongooseObject: booking.slotId instanceof mongoose.Types.ObjectId,
        hasStartTime: booking.slotId?.startTime !== undefined,
        hasEndTime: booking.slotId?.endTime !== undefined,
        slotStartTime: booking.slotId?.startTime,
        slotEndTime: booking.slotId?.endTime,
        visitTime: booking.visitTime,
        createdAt: booking.createdAt
      });

      // Fetch Slot model dynamically if not imported
      let Slot;
      try {
        Slot = mongoose.model('Slot');
      } catch (e) {
        // If model not registered, try to import it
        Slot = (await import("../models/Slot.js")).default;
      }

      // For CLINIC visits - fetch slot data if not populated
      if (booking.visitType === "CLINIC") {
        let slotData = booking.slotId;
        let shouldUseSlotData = false;
        
        // Check if slotId exists
        if (slotData) {
          // If slotId is a MongoDB ObjectId (not populated)
          if (slotData instanceof mongoose.Types.ObjectId || 
              (typeof slotData === 'object' && slotData._bsontype === 'ObjectId') ||
              (typeof slotData === 'string' && mongoose.Types.ObjectId.isValid(slotData))) {
            
            console.log("🔍 Slot is ObjectId, fetching slot data...");
            
            try {
              // Fetch the slot document
              const fetchedSlot = await Slot.findById(slotData);
              
              if (fetchedSlot && fetchedSlot.startTime) {
                console.log("✅ Successfully fetched slot data");
                console.log("📅 Fetched Slot:", {
                  startTime: fetchedSlot.startTime,
                  endTime: fetchedSlot.endTime,
                  visitType: fetchedSlot.visitType
                });
                
                slotData = fetchedSlot;
                shouldUseSlotData = true;
              } else {
                console.log("⚠️ Could not fetch slot data or slot has no startTime");
              }
            } catch (fetchError) {
              console.error("❌ Error fetching slot:", fetchError.message);
            }
          } 
          // If slotId is already populated with startTime
          else if (slotData.startTime) {
            console.log("✅ Slot data already populated");
            shouldUseSlotData = true;
          }
        }
        
        // Use slot data if available
        if (shouldUseSlotData && slotData.startTime) {
          const start = new Date(slotData.startTime);
          let end;
          
          if (slotData.endTime) {
            end = new Date(slotData.endTime);
          } else {
            // If no end time, assume 30 minute slot
            end = new Date(start.getTime() + 30 * 60000);
          }

          dateStr = start.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          timeStr = `${start.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })} – ${end.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}`;
          
          console.log("✅ Using SLOT time for CLINIC visit:");
          console.log("   Appointment Date:", dateStr);
          console.log("   Appointment Time:", timeStr);
          console.log("   Original Slot Start:", slotData.startTime);
          console.log("   Original Slot End:", slotData.endTime || "Not specified (using 30min default)");
        } else {
          console.log("⚠️ No valid slot data available, using createdAt");
          const created = new Date(booking.createdAt);
          dateStr = created.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          timeStr = "As per schedule";
        }
      } 
      // For HOME visits - use visitTime if available, otherwise use createdAt
     else if (booking.visitType === "HOME") {
  if (booking.visitTime && typeof booking.visitTime === "string") {
    try {
      // Expected format: startISO|endISO
      const [startISO, endISO] = booking.visitTime.split("|");

      const start = new Date(startISO);
      const end = new Date(endISO);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid visitTime ISO format");
      }

      dateStr = start.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      timeStr = `${start.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })} – ${end.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;

      console.log("✅ Using visitTime for HOME visit:", booking.visitTime);
    } catch (error) {
      console.log("⚠️ Failed to parse visitTime, using createdAt");
      const created = new Date(booking.createdAt);
      dateStr = created.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      timeStr = "As per schedule";
    }
  } else {
    console.log("⚠️ HOME booking has no visitTime, using createdAt");
    const created = new Date(booking.createdAt);
    dateStr = created.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    timeStr = "As per schedule";
  }
}


      // Final console logs
      console.log("📅 FINAL BOOKING DATE:", dateStr);
      console.log("⏰ FINAL BOOKING TIME:", timeStr);

      /* ================= DARK BACKGROUND ================= */
      doc.rect(0, 0, doc.page.width, doc.page.height).fill("#020617");
      doc.fillColor("#E5E7EB");

      /* ================= HEADER ================= */
      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor("#22D3EE")
        .text("Dr. Ahad Sk (PT)", 50, 50);

      doc
        .moveDown(0.2)
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#CBD5E1")
        .text("Consultant Physiotherapist | BPT (Kol), FIMT, NABH")
        .text("Reg No: 20013000306 | Ex-Intern, Chanchal Super Speciality Hospital");

      doc.moveDown(0.6);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#1E293B").stroke();

      /* ================= TITLE ================= */
      doc.moveDown(0.6);
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#F8FAFC")
        .text("Appointment Confirmation");

      doc.moveDown(0.8);

      /* ================= PATIENT CARD ================= */
      const patientY = doc.y;
      doc
        .roundedRect(50, patientY, 495, 92, 12)
        .fillAndStroke("#020617", "#1E293B");

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#38BDF8")
        .text("Patient Information", 68, patientY + 12);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#E5E7EB")
        .text(`Booking ID: ${booking._id}`, 68, patientY + 36)
        .text(`Name: ${booking.patientName}`)
        .text(`Phone: ${booking.phone}`);

      doc.moveDown(5);

      /* ================= VISIT CARD (WITH DATE & TIME) ================= */
      const visitY = doc.y;
      doc
        .roundedRect(50, visitY, 495, 160, 12)
        .fillAndStroke("#020617", "#1E293B");

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#38BDF8")
        .text("Visit Details", 68, visitY + 12);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#E5E7EB")
        .text(`Visit Type: ${booking.visitType}`, 68, visitY + 36)
        .text(`Pain Area: ${booking.painArea}`)
        .text(`Duration: ${booking.painDuration}`)
        .text(`Date: ${dateStr}`)
        .text(`Time: ${timeStr}`);

      doc.moveDown(8);

      /* ================= HOME VISIT CARD ================= */
      if (booking.visitType === "HOME") {
        const homeY = doc.y;

        doc
          .roundedRect(50, homeY, 495, 155, 12)
          .fillAndStroke("#022C22", "#065F46");

        doc
          .font("Helvetica-Bold")
          .fontSize(13)
          .fillColor("#34D399")
          .text("Home Visit Details", 68, homeY + 12);

        const fullAddress = booking.address
          ? [
              booking.address.house,
              booking.address.area,
              booking.address.city,
              booking.address.pincode,
            ]
              .filter(Boolean)
              .join(", ")
          : "N/A";

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#ECFDF5")
          .text(`Address: ${fullAddress}`, 68, homeY + 34)
          .text(`Distance: ${booking.distanceKm?.toFixed(1)} km`)
          .text(`Visit Time: ${timeStr}`);

        const base = 500;
        const extraKm = Math.max(0, Math.ceil((booking.distanceKm || 0) - 4));
        const extraCharge = extraKm * 20;

        doc
          .moveDown(0.3)
          .text(`Base Charge (4 km): ₹${base}`)
          .text(`Extra Charge (${extraKm} km × ₹20): ₹${extraCharge}`);

        /* ===== TOTAL PAID STRIP ===== */
        doc
          .moveDown(0.6)
          .roundedRect(68, doc.y, 460, 30, 10)
          .fill("#22C55E");

        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .fillColor("#022C22")
          .text(`Total Paid: ₹${booking.totalAmount}`, 90, doc.y + 8);

        doc.moveDown(3);
      }

      /* ================= PAYMENT STATUS ================= */
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#4ADE80")
        .text("Payment Status: PAID");

      doc.moveDown(1);

      /* ================= FOOTER ================= */
      doc
        .moveTo(140, doc.y)
        .lineTo(460, doc.y)
        .strokeColor("#1E293B")
        .stroke();

      doc.moveDown(0.6);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#F8FAFC")
        .text("Kaliachak Advance Physiotherapy Clinic", { align: "center" });

      doc.moveDown(0.3);

      doc
        .font("Helvetica-Bold")
        .fontSize(8.8)
        .fillColor("#CBD5E1")
        .text(
          "Baliadanga NH-12, Front of Eidgah | B.D.O Office Opposite Road, Kaliachak, Malda",
          { align: "center" }
        );

      doc.moveDown(0.3);

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#E5E7EB")
        .text("Phone: 6297498646 / 7586091036", {
          align: "center",
        });

      doc.moveDown(0.4);

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor("#64748B")
        .text("System-generated receipt. No signature required.", {
          align: "center",
        });

      doc.end();

      stream.on("finish", () => {
        console.log("✅ PDF SAVED AT:", absoluteFilePath);
        resolve(`uploads/receipts/${fileName}`);
      });

      stream.on("error", (err) => {
        console.error("❌ PDF Stream Error:", err);
        reject(err);
      });
    } catch (err) {
      console.error("❌ PDF Generation Error:", err);
      reject(err);
    }
  });
};

export default generateBookingPDF;