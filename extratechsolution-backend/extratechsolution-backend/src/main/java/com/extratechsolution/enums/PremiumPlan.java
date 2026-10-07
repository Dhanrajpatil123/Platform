package com.extratechsolution.enums;

public enum PremiumPlan {

    // Placeholder prices. Set your real ones before launch.
    MONTHLY("Monthly", 30, 199),
    YEARLY("Yearly", 365, 1499);

    private final String label;
    private final int days;
    private final int priceInr;

    PremiumPlan(String label, int days, int priceInr) {
        this.label = label;
        this.days = days;
        this.priceInr = priceInr;
    }

    public String getLabel() {
        return label;
    }

    public int getDays() {
        return days;
    }

    public int getPriceInr() {
        return priceInr;
    }

}
