export const generateRandomLoyaltyPoints = (bookingCost: number): number => {
    const basePoints = Math.floor(bookingCost);
    
    // Random bonus points: 0 to 10% of the base pointsx
    const bonusPoints = Math.floor(Math.random() * (basePoints * 0.1));
    
    return basePoints + bonusPoints;
};
