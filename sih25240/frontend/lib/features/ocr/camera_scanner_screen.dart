import 'package:flutter/material.dart';

class CameraScannerScreen extends StatelessWidget {
  const CameraScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Document'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.document_scanner, size: 100, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('Camera Scanner UI Placeholder\n(Will integrate camera package here)', textAlign: TextAlign.center),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                // TODO: Simulate scan and navigate to translation
                Navigator.of(context).pop();
              },
              child: const Text('Simulate Scan Complete'),
            )
          ],
        ),
      ),
    );
  }
}
