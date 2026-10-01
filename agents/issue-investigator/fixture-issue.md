Issue: Missing import in main.ts

The main.ts file is trying to import a function that doesn't exist.

Error:
```
Cannot find module 'utils/helper'
```

This is blocking the build. When I try to run `npm start`, I get:

```
TypeError: Cannot find module 'utils/helper'
    at Object.<anonymous> (/app/src/main.ts:15:1)
```

The import statement in main.ts looks like:
```typescript
import { processData } from './utils/helper';
```

But I'm not sure if this file exists or if the path is wrong.
