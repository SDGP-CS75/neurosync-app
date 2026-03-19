import React, { useState, useEffect } from "react";
import { Portal, Dialog, Button, TextInput } from "react-native-paper";
import { theme } from "../constants/theme";

interface InputDialogProps {
  visible: boolean;
  hideDialog: () => void;
  title: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  initialValue?: string;
}

const InputDialog: React.FC<InputDialogProps> = ({
    visible,
    hideDialog,
    title,
    placeholder,
    onSubmit,
    initialValue = "",
}) => {

    const [text, setText] = useState<string>(initialValue);

    // Reset text when dialog opens with a new initial value
    useEffect(() => {
        if (visible) {
            setText(initialValue);
        }
    }, [visible, initialValue]);

    const handleSubmit = () => {
        onSubmit(text);
        setText("");
        hideDialog();
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={hideDialog}>
            
            <Dialog.Title style={{ color: theme.colors.textMuted }}>{title}</Dialog.Title>

            <Dialog.Content>
                <TextInput
                label={placeholder}
                value={text}
                onChangeText={setText}
                mode="outlined"
                style={{ borderRadius: 30 }}
                />
            </Dialog.Content>

            <Dialog.Actions>
                <Button onPress={hideDialog}>Cancel</Button>
                <Button onPress={handleSubmit}>Submit</Button>
            </Dialog.Actions>

            </Dialog>
        </Portal>
    );
};

export default InputDialog;