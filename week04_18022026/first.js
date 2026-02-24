class Car {
    constructor(brand) {
        this.brand = brand;
    }

    showBrand() {
        console.log("Car brand is " + this.brand);
    }
}

let myCar = new Car("Toyota");
myCar.showBrand();
