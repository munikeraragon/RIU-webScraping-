const puppeteer = require('puppeteer');

// Helper function to get next Friday from a given date
function getNextFriday(date) {
    const result = new Date(date);
    const daysUntilFriday = (5 - result.getDay() + 7) % 7;
    if (daysUntilFriday === 0 && result.getDay() === 5) {
        result.setDate(result.getDate() + 7); // If today is Friday, get next Friday
    } else {
        result.setDate(result.getDate() + daysUntilFriday);
    }
    return result;
}

// Generate Friday check-in dates for a month
function generateFridayDates() {
    const dates = [];
    const today = new Date();
    let currentFriday = getNextFriday(today);
    
    for (let i = 0; i < 4; i++) { // 4 weeks
        const checkIn = new Date(currentFriday);
        const checkOut = new Date(currentFriday);
        checkOut.setDate(checkOut.getDate() + 7); // Next Friday
        
        dates.push({
            checkIn: checkIn,
            checkOut: checkOut,
            checkInDay: checkIn.getDate(),
            checkOutDay: checkOut.getDate()
        });
        
        currentFriday.setDate(currentFriday.getDate() + 7); // Move to next Friday
    }
    return dates;
}

async function searchHotelPrice(page, checkInDay, checkOutDay) {
    // Click datepicker
    await page.click('#datepicker-field');
    await page.waitForTimeout(2000);

    // Select check-in date
    await page.evaluate((day) => {
        const dayButtons = Array.from(document.querySelectorAll('.riu-datepicker__item--day'));
        const dayButton = dayButtons.find(button => {
            const span = button.querySelector('span');
            return span && span.textContent.trim() === day.toString() && 
                   !button.classList.contains('riu-datepicker__item--disabled') &&
                   !button.classList.contains('riu-datepicker__item--otherMonth');
        });
        if (dayButton) dayButton.click();
    }, checkInDay);
    
    await page.waitForTimeout(1000);

    // Select check-out date
    await page.evaluate((day) => {
        const dayButtons = Array.from(document.querySelectorAll('.riu-datepicker__item--day'));
        const dayButton = dayButtons.find(button => {
            const span = button.querySelector('span');
            return span && span.textContent.trim() === day.toString() && 
                   !button.classList.contains('riu-datepicker__item--disabled') &&
                   !button.classList.contains('riu-datepicker__item--otherMonth');
        });
        if (dayButton) dayButton.click();
    }, checkOutDay);

    await page.waitForTimeout(1000);

    // Click search
    await page.click('#search-button');
    await page.waitForTimeout(5000);

    // Get price
    try {
        await page.waitForSelector('.riu-card-hotel__price-box__content__price', { timeout: 15000 });
        const price = await page.$eval('.riu-card-hotel__price-box__content__price', el => el.textContent.trim());
        return price;
    } catch (error) {
        return 'Price not found';
    }
}

async function riuHotelSearch() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();
        
        console.log('Navigating to RIU booking page...');
        await page.goto('https://www.riu.com/en/booking/rooms', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Handle cookie consent
        try {
            await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
            await page.click('#onetrust-accept-btn-handler');
            await page.waitForTimeout(2000);
            console.log('Cookie banner accepted');
        } catch (error) {
            console.log('No cookie banner found');
        }

        // Setup hotel selection
        await page.waitForSelector('#searchInputDestination', { timeout: 10000 });
        await page.click('#searchInputDestination');
        await page.waitForTimeout(3000);
        console.log('Search input clicked');

        // Select USA
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('span.riu-button__html-content'));
            const usaButton = buttons.find(button => button.textContent.trim() === 'USA');
            if (usaButton) usaButton.click();
        });
        await page.waitForTimeout(2000);

        // Select Miami Beach
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('span.riu-button__html-content'));
            const miamiButton = buttons.find(button => button.textContent.includes('Miami Beach'));
            if (miamiButton) miamiButton.click();
        });
        await page.waitForTimeout(2000);

        // Select Hotel RIU Plaza Miami Beach
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('span.riu-button__html-content'));
            const riuPlazaButton = buttons.find(button => button.textContent.includes('Hotel Riu Plaza Miami Beach'));
            if (riuPlazaButton) riuPlazaButton.click();
        });
        await page.waitForTimeout(2000);

        // Get Friday dates for a month
        const fridayDates = generateFridayDates();
        const prices = [];

        
        // Loop through each Friday-to-Friday period
        for (let i = 0; i < fridayDates.length; i++) {
            const { checkIn, checkOut, checkInDay, checkOutDay } = fridayDates[i];
            
            const price = await searchHotelPrice(page, checkInDay, checkOutDay);
            
            prices.push({
                checkIn: checkIn.toDateString(),
                checkOut: checkOut.toDateString(),
                price: price
            });
            
            console.log(`Price: ${price}`);
        }

        // Display all results
        console.log('\n=== HOTEL PRICING SCRAPING COMPLETE ===');
        prices.forEach((entry, index) => {
            console.log(`Week ${index + 1}: ${entry.checkIn} to ${entry.checkOut} - ${entry.price}`);
        });

        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }
}

// Run the script
riuHotelSearch().then(() => {
    console.log('Script execution completed');
}).catch(error => {
    console.error('Script failed:', error);
});
