// This file contains utility functions for generating seat layouts for buses and flights

// Generate default seat layout for buses
const generateDefaultSeatLayout = (bus, date) => {
    const { id, totalSeats, rows, columns, category } = bus;

    // Create an empty seat layout
    const seatLayout = {
        busId: id,
        date,
        seats: [],
        lastUpdated: new Date(),
    };

    // Define seat status options based on category
    const premiumProbability = category === 'premium' ? 0.3 : 0.2;

    // Generate seats
    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= columns; col++) {
            // Skip seat if it's an aisle (typically column 3 in buses)
            if (col === 3) continue;

            // Generate seat code (e.g., A1, B2)
            const rowLetter = String.fromCharCode(64 + row); // Convert 1 to A, 2 to B, etc.
            const seatCode = `${rowLetter}${col}`;

            // Random status assignment (mostly available)
            const random = Math.random();
            let status = 'available';
            if (random < 0.1) {
                status = 'booked';
            } else if (random < premiumProbability) {
                status = 'premium';
            }

            seatLayout.seats.push({
                seatCode,
                row,
                column: col,
                status,
                price: status === 'premium' ? bus.price * 1.2 : bus.price,
            });
        }
    }

    return seatLayout;
};

// Function to generate default flight seat layout
function generateDefaultFlightSeatLayout(flight, date) {
    const totalRows = 30;
    const seatsPerRow = 6;
    const seats = [];

    // Create default seat structure
    for (let row = 1; row <= totalRows; row++) {
        for (let seatLetter = 0; seatLetter < seatsPerRow; seatLetter++) {
            // Convert 0-5 to A-F
            const seatLetterChar = String.fromCharCode(65 + seatLetter);
            const seatNumber = row * 10 + seatLetter;

            // Determine seat type based on row
            let type = "economy";
            if (row <= 2) {
                type = "first";
            } else if (row <= 7) {
                type = "business";
            } else if (row <= 12) {
                type = "premium-economy";
            }

            seats.push({
                seatNumber,
                seatPosition: `${row}${seatLetterChar}`,
                status: "available",
                type,
                reservation: null
            });
        }
    }

    return {
        flightId: flight._id || flight.id,
        date,
        seats,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

module.exports = {
    generateDefaultSeatLayout,
    generateDefaultFlightSeatLayout
};