# sharepoint-recurring-events

The purpose of this package is to help us work with recurring events in SharePoint.  This is necessary because the SharePoint REST API endpoint does not expand events for us, but instead returns events with an XML based recurrence information.  This library takes that recurrence information and expands it to a list of events.

Eventually, this project will also allow for the reverse: creating recurring events with that same recurrence structure but in an easier to use API that will convert or build the XML structure for the user.

## Technical Contributing Info

- package manager: [pnpm](https://pnpm.io/), because it provides the most control over our node modules and it is efficient with no hidden dependencies.
- node version: as of this writing we use `16.15.0`, but check the [.node-version file](./.node-version) for the most up-to-date version.  We use this paired with [nvs](https://github.com/jasongin/nvs) to easily switch between versions of node on one machine.  And we stick to LTS version for the support.

---

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

## Telemetry Notice

This package does not collect any telemetry for Microsoft or any other organization.  Therefore, there is nothing to turn off.
