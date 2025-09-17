const puppeteer = require('puppeteer');

async function riuHotelSearch() {
    const browser = await puppeteer.launch({
        headless: false, // Set to true if you want to run without opening browser window
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

        // Handle cookie consent first
        console.log('Looking for cookie consent banner...');
        try {
            await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
            await page.click('#onetrust-accept-btn-handler');
            await page.waitForTimeout(2000);
            console.log('Cookies accepted successfully!');
        } catch (error) {
            console.log('No cookie banner found or already accepted');
        }

        // Wait for the search input to be visible
        await page.waitForSelector('#searchInputDestination', { timeout: 10000 });

        // Click on the search input field to open the destination selector
        console.log('Clicking on search input field...');
        await page.click('#searchInputDestination');

        // Wait for the destination tree to appear
        await page.waitForTimeout(3000);

        // Step 1: Click on USA button
        try {
            await page.waitForSelector('span.riu-button__html-content', { timeout: 10000 });
            
            // Find and click the USA button
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('span.riu-button__html-content'));
                const usaButton = buttons.find(button => button.textContent.trim() === 'USA');
                if (usaButton) {
                    usaButton.click();
                } else {
                    throw new Error('USA button not found');
                }
            });

            console.log('USA button selected successfully!');
            await page.waitForTimeout(2000);
        } catch (error) {
            console.error('Error selecting USA:', error);
        }

        // Step 2: Click on Miami Beach destination
        try {
            await page.waitForTimeout(2000);
            
            // Find and click Miami Beach destination
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('span.riu-button__html-content'));
                const miamiButton = buttons.find(button => 
                    button.textContent.includes('Miami Beach')
                );
                if (miamiButton) {
                    miamiButton.click();
                } else {
                    throw new Error('Miami Beach button not found');
                }
            });
            
            console.log('Miami Beach button selected successfully!');
            await page.waitForTimeout(2000);
        } catch (error) {
            console.error('Error selecting Miami Beach:', error);
        }

        // Step 3: Click on Hotel RIU Plaza Miami Beach
        try {
            await page.waitForTimeout(2000);
            
            // Find and click the RIU Plaza Miami Beach hotel
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('span.riu-button__html-content'));
                const riuPlazaButton = buttons.find(button => 
                    button.textContent.includes('Hotel Riu Plaza Miami Beach')
                );
                if (riuPlazaButton) {
                    riuPlazaButton.click();
                } else {
                    throw new Error('Hotel Riu Plaza Miami Beach button not found');
                }
            });
            
            console.log('Hotel RIU Plaza Miami Beach button selected successfully!');
            await page.waitForTimeout(2000);
        } catch (error) {
            console.error('Error selecting Hotel RIU Plaza Miami Beach:', error);
        }

        // Step 4: Click on the datepicker to select dates
        console.log('Opening calendar...');
        try {
            await page.waitForSelector('#datepicker-field', { timeout: 10000 });
            await page.click('#datepicker-field');
            await page.waitForTimeout(2000);
            console.log('Calendar opened successfully!');
        } catch (error) {
            console.error('Error opening calendar:', error);
        }

        // Step 5: Select September 25 as check-in date
        console.log('Selecting September 25 as check-in date...');
        try {
            await page.waitForSelector('.riu-datepicker__item--day', { timeout: 5000 });
            
            // Find and click September 25
            await page.evaluate(() => {
                const dayButtons = Array.from(document.querySelectorAll('.riu-datepicker__item--day'));
                const sept25Button = dayButtons.find(button => {
                    const span = button.querySelector('span');
                    return span && span.textContent.trim() === '25' && 
                           !button.classList.contains('riu-datepicker__item--disabled') &&
                           !button.classList.contains('riu-datepicker__item--otherMonth');
                });
                if (sept25Button) {
                    sept25Button.click();
                } else {
                    throw new Error('September 25 not found');
                }
            });
            
            await page.waitForTimeout(1000);
            console.log('Check-in date selected successfully!');
        } catch (error) {
            console.error('Error selecting September 25:', error);
        }

        // Step 6: Select October 3 as check-out date
        console.log('Selecting October 3 as check-out date...');
        try {
            await page.waitForTimeout(1000);
            
            // Find and click October 3
            await page.evaluate(() => {
                const dayButtons = Array.from(document.querySelectorAll('.riu-datepicker__item--day'));
                const oct3Button = dayButtons.find(button => {
                    const span = button.querySelector('span');
                    return span && span.textContent.trim() === '3' && 
                           !button.classList.contains('riu-datepicker__item--disabled') &&
                           !button.classList.contains('riu-datepicker__item--otherMonth');
                });
                if (oct3Button) {
                    oct3Button.click();
                } else {
                    throw new Error('October 3 not found');
                }
            });
            
            await page.waitForTimeout(1000);
            console.log('Check-out date selected successfully!');
        } catch (error) {
            console.error('Error selecting October 3:', error);
        }

        // Step 7: Click the Search button
        console.log('Clicking Search button...');
        try {
            await page.waitForSelector('#search-button', { timeout: 10000 });
            await page.click('#search-button');
            console.log('Search button clicked successfully!');
            
            // Wait for search results to load
            await page.waitForTimeout(5000);
        } catch (error) {
            console.error('Error clicking Search button:', error);
        }

        // Step 8: Scrape the hotel price
        console.log('Scraping hotel price...');
        try {
            // Wait for price element to appear
            await page.waitForSelector('.riu-card-hotel__price-box__content__price', { timeout: 15000 });
            
            // Extract the full price text
            const fullPrice = await page.$eval('.riu-card-hotel__price-box__content__price', el => el.textContent.trim());
            
            console.log('=== ✅ Price scraped successfully! ===');
            console.log(`Hotel Price: ${fullPrice}`);
            
        } catch (error) {
            console.error('Error scraping price:', error);
        }
        
        // Keep browser open for 10 seconds to see results
        await page.waitForTimeout(10000);

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
