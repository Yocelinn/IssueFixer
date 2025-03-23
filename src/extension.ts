// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { json } from 'stream/consumers';
import * as vscode from 'vscode';
import moment from 'moment';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "IssueFixer" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('IssueFixer.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from IssueFixer!');
	});

	let disposable2 = vscode.commands.registerCommand('IssueFixer.searchIssue', async () => {
        // 让用户输入仓库名称
        const repoName = await vscode.window.showInputBox({
            prompt: "Enter GitHub Repository (e.g., owner/repo)",
            placeHolder: "e.g., microsoft/vscode",
        });

        if (!repoName) {
            vscode.window.showErrorMessage("Repository name is required.");
            return;
        }

        // 让用户输入 Issue ID
        const issueNumber = await vscode.window.showInputBox({
            prompt: "Enter Issue Number",
            placeHolder: "e.g., 123",
        });

        if (!issueNumber) {
            vscode.window.showErrorMessage("Issue number is required.");
            return;
        }

        vscode.window.showInformationMessage(`Searching issue ${issueNumber} in ${repoName}...`);

        // 调用 API 获取 Issue 数据
        searchIssue(repoName, issueNumber);
    });

    context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);

}

interface Issue {
    title: string;
    body: string;
    html_url: string;
    [key: string]: any; // 允许任意属性
}

async function searchIssue(repo: string, issueNumber: string) {
    const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}`;
    
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
        if (!response.ok) { throw new Error(`GitHub API error: ${response.status}`);}

        const issueData = await response.json() as Issue;
		
        vscode.window.showInformationMessage(`Issue Title: ${issueData.title}`);

        // 这里可以把 issueData 发送到 Webview 显示
		// 创建 WebView
        const panel = vscode.window.createWebviewPanel(
            'issueView',
            `Issue #${issueNumber}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        // 在 WebView 里嵌入 GitHub 页面
        // panel.webview.html = `
        //     <html>
        //     <head>
        //         <style> body { font-family: sans-serif; padding: 20px; } </style>
        //     </head>
        //     <body>
        //         <h1>${issueData.title}</h1>
        //         <p>${issueData.body.replace(/\n/g, "<br>")}</p>
				 

        //         <p><a href="${issueData.html_url}" target="_blank">View on GitHub</a></p>
        //     </body>
        //     </html>
        // `;
        panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Issue Viewer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 20px;
            background-color: #f6f8fa;
        }
        .container {
            max-width: 800px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .title {
            font-size: 24px;
            font-weight: bold;
        }
        .meta {
            color:rgb(88, 95, 103);
            margin: 10px 0;
            font-size:15px;
        }
        .user {
            display: flex;
            align-items: center;
        }
        .user img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .status {
            padding: 5px 10px;
            border-radius: 40px;
            font-size: 14px;
            font-weight: bold;
            width: 8%;
        }
        .closed { background: #cf222e; color: white; }
        .open { background: #1f883d; color: white; }
        .comment-count {
            font-size: 14px;
            color: #0366d6;
        }
        .body-container {
            font-size: 14px;
            margin: 20px;
            border-radius: 10px;
            border: 1px rgb(98, 107, 118) solid;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
        }
        .footer a {
            text-decoration: none;
            background: #0366d6;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">${issueData.title}</div>
        <div class="status closed"  v-if="${issueData.state} == 'closed'">closed</div>
        <div class="status open"  v-else> open </div>
        
        <div class="meta">
            Issue #${issueData.number} opened by 
            <span class="user">
                <img src=${issueData.user.avatar_url} alt="User Avatar">
                <a href=${issueData.user.html_url} style="font-size:18px; color:black;"> ${issueData.user.login}</a>
            </span>
            <br>
            Created at: ${moment(issueData.created_at).format('YYYY-MM-DD HH:mm:ss')}
        </div>
        
        <div class="body-container">
            <div style ="padding: 15px;"> ${issueData.body} </div>
        </div>
        <div class="comment-count">Comments: 1</div>

        <div class="footer">
            <a href=${issueData.html_url} target="_blank">View on GitHub</a>
        </div>
    </div>
</body>
</html>`;
    } catch (error) {
		console.log(`error in finding issue : ${error}`);
        vscode.window.showErrorMessage(`Failed to fetch issue: ${error}`);
    }
}
	

// This method is called when your extension is deactivated
export function deactivate() {}
