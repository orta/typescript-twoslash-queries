// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const provider: vscode.InlayHintsProvider = {
		provideInlayHints: async (model, iRange, cancel) => {
			// TODO: could use range for a speed boost?
			
			const offset = model.offsetAt(iRange.start)
			const text = model.getText(iRange);
			const queryRegex = /^\s*\/\/\s*\^\?$/gm;
			let match;
			const results: vscode.InlayHint[] = [];

			while ((match = queryRegex.exec(text)) !== null) {
				const end = match.index + match[0].length - 1;
				// Add the start range for the inlay hint
				const endPos = model.positionAt(end + offset);
				const inspectionPos = new vscode.Position(endPos.line - 1, endPos.character);
				
				if (cancel.isCancellationRequested) {return [];};

				const file = model.uri.path;
				const hint: any = await vscode.commands.executeCommand('typescript.tsserverRequest', 'quickinfo', { _:"%%%", file, line: inspectionPos.line, offset: inspectionPos.character });

				if (!hint || !hint.body) {continue;};

				// Make a one-liner
				let text = hint.body.displayString.replace(/\\n/g, " ").replace(/\/n/g, " ").replace(/  /g, " ").replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
				if (text.length > 120) {text = text.slice(0, 119) + "...";};

				const inlay: vscode.InlayHint = {
					kind: 0,
					position: new vscode.Position(endPos.line, endPos.character + 1),
					text,
					whitespaceBefore: true,
				};
				results.push(inlay);
			}
			return results;
		}
	};



	context.subscriptions.push(
		vscode.languages.registerInlayHintsProvider([{ language: "javascript"}, { language: "typescript"}] , provider)
	);
}

export function deactivate() { }
