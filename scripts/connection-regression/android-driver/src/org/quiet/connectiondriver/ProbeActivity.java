package org.quiet.connectiondriver;

import android.app.Activity;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Device-side self-test for native text entry and a real click handler. */
public final class ProbeActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        EditText input = new EditText(this);
        TextView result = new TextView(this);
        Button copy = new Button(this);
        copy.setAllCaps(false);
        copy.setText("Driver echo");
        copy.setOnClickListener(view -> result.setText("Echo: " + input.getText()));
        layout.addView(input);
        layout.addView(copy);
        layout.addView(result);
        setContentView(layout);
    }
}
