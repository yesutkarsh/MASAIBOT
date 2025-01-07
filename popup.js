// Content script functions that will be injected
function injectableScript() {
    function extractQuestionDetails() {
        const details = {
            title: '',
            description: '',
            inputDesc: '',
            outputDesc: '',
            sampleInput: '',
            sampleOutput: '',
            constraints: []
        };

        try {
            // Extract title
            const titleElement = document.querySelector('.css-18x40yl .chakra-text.css-e1jld8:first-child');
            details.title = titleElement?.textContent?.trim() || '';

            // Extract description
            const descElement = document.querySelector('.css-1sfno4f + .css-14sb86c .chakra-text.css-uagrq8');
            details.description = descElement?.textContent?.trim() || '';

            // Extract input description and constraints
            const inputDescElement = document.querySelector('.css-178yklu .chakra-text.css-uagrq8');
            if (inputDescElement) {
                details.inputDesc = inputDescElement.textContent.trim();
                
                // Extract constraints
                const constraintsList = inputDescElement.querySelector('ul');
                if (constraintsList) {
                    Array.from(constraintsList.getElementsByTagName('li')).forEach(li => {
                        details.constraints.push(li.textContent.trim());
                    });
                }
            }

            // Extract output description
            const outputDescElement = document.querySelector('.css-178yklu:nth-of-type(3) .chakra-text.css-uagrq8');
            details.outputDesc = outputDescElement?.textContent?.trim() || '';

            // Extract sample input/output
            const sampleInputElement = document.querySelector('.css-178yklu textarea:not([readonly])');
            details.sampleInput = sampleInputElement?.value?.trim() || '';

            const sampleOutputElement = document.querySelector('.css-178yklu textarea[readonly]');
            details.sampleOutput = sampleOutputElement?.value?.trim() || '';

            console.log('Extracted details:', details); // Debug log
            return details;

        } catch (error) {
            console.error('Error in extractQuestionDetails:', error);
            return details;
        }
    }

    // Main function to get question from page
    async function getQuestionFromPage() {
        try {
            const questionDetails = extractQuestionDetails();
            console.log('Question details:', questionDetails); // Debug log

            if (!questionDetails.title) {
                console.log("Question details not found!");
                return "No question details found";
            }

            // Format the question text
            const formattedQuestion = `
Problem: ${questionDetails.title}

Description:
${questionDetails.description}

Input Format:
${questionDetails.inputDesc}

Output Format:
${questionDetails.outputDesc}

Constraints:
${questionDetails.constraints.map(c => '- ' + c).join('\n')}

Sample Input:
${questionDetails.sampleInput}

Sample Output:
${questionDetails.sampleOutput}
`.trim();

            return formattedQuestion;

        } catch (error) {
            console.error('Error in getQuestionFromPage:', error);
            return null;
        }
    }

    return getQuestionFromPage();
}

// Main extension code
document.getElementById("get-question").addEventListener("click", async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: injectableScript
        });

        if (results && results[0] && results[0].result) {
            const question = results[0].result;
            
            document.getElementById("get-question").innerHTML = '<div class="loader"></div>';

            const API_KEY = 'Your API KEY'; // Replace with your API key
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: `As a JavaScript developer, please help me understand this DSA question. Provide your response in the following HTML structure:

${question}

<div class="response-container">
    <h1 class="question-title">[Question Title]</h1>
    
    <div class="explanation-section">
        <h2>Problem Understanding</h2>
        <ul>
            [Provide clear bullet points explaining the problem in JavaScript context]
        </ul>
    </div>

    <div class="approach-section">
        <h2>Problem-Solving Approach</h2>
        <ul>
            [List the steps to solve this problem]
        </ul>
    </div>

    <div class="key-concepts-section">
        <h2>Key Concepts & Patterns</h2>
        <ul>
            [List important concepts and patterns to understand]
        </ul>
    </div>

    <div class="implementation-section">
        <h2>Implementation Guide</h2>
        <div class="code-block">
            <pre>
                // Implementation approach using JavaScript
                class Node {
                    constructor(data) {
                        this.data = data;
                        this.next = null;
                    }
                }

                function insertAtTail(head, data) {
                    // Your implementation explanation here
                }
            </pre>
        </div>
    </div>

    <div class="tips-section">
        <h2>JavaScript-Specific Tips</h2>
        <ul>
            [List JavaScript-specific considerations and tips]
        </ul>
    </div>

    <div class="complexity-section">
        <h2>Complexity Analysis</h2>
        <ul>
            [Provide time and space complexity analysis]
        </ul>
    </div>
</div>

Note: Format your response in proper HTML with the exact structure shown above. Each section should be detailed and comprehensive.`
                    }]
                }]
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            document.getElementById("question-display").innerHTML = 
                data.candidates[0]?.content?.parts[0]?.text || "No response from API";
            
            document.getElementById("get-question").innerHTML = "Get Question";

        } else {
            document.getElementById("question-display").innerText = "No question found!";
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("question-display").innerText = `Error: ${error.message}`;
        document.getElementById("get-question").innerHTML = "Get Question";
    }
});