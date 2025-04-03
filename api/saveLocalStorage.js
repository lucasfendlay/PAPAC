export default async function handler(req, res) {
    if (req.method === 'POST') {
        const data = req.body;

        // Example: Save the data to a database or file storage
        console.log('Received data:', data);

        // Respond with success
        res.status(200).json({ message: 'Data saved successfully' });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}